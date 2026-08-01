import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/db';
import { z } from 'zod';

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }
    const { email, password } = parsed.data;

    // 1. Rate limiting should be handled by a middleware (omitted here for simplicity, or we can track failed attempts)
    
    // 2. Find account
    const account = await prisma.accountUser.findUnique({
      where: { email },
      include: { personnel: true }
    });

    if (!account || account.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, account.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. Create session
    const sid = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    const sessionData = JSON.stringify({
      accountId: account.id,
      sessionVersion: account.sessionVersion
    });

    await prisma.session.create({
      data: {
        sid,
        data: sessionData,
        expiresAt
      }
    });

    // 5. Set cookie
    res.cookie('sid', sid, {
      ...sessionCookieOptions,
      expires: expiresAt
    });

    // 6. Audit log
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        entityType: 'AccountUser',
        entityId: account.id,
        actorId: account.personnelId,
        details: JSON.stringify({ ip: req.ip })
      }
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        ...account.personnel,
        id: account.personnelId,
        email: account.email,
        name: account.personnel.name,
        role: account.personnel.role,
        employmentStatus: account.personnel.employmentStatus || 'ACTIVE',
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const sid = req.cookies.sid;
    if (sid) {
      await prisma.session.deleteMany({ where: { sid } });
      res.clearCookie('sid', sessionCookieOptions);
    }
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getSession = async (req: Request, res: Response) => {
  const sessionUser = req.user;
  if (!sessionUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const personnel = await prisma.personnelCard.findUnique({
    where: { id: sessionUser.personnelId },
  });
  if (!personnel) {
    return res.status(401).json({ error: 'Unauthorized: Personnel not found' });
  }

  res.status(200).json({
    user: {
      ...personnel,
      id: personnel.id,
      email: sessionUser.email,
      role: sessionUser.role,
      employmentStatus: personnel.employmentStatus || 'ACTIVE',
    },
  });
};

// Admin only: create invite token
export const createInvite = async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ error: 'Email and role required' });

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

    const invite = await prisma.inviteToken.create({
      data: {
        email,
        role,
        tokenHash,
        expiresAt
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE_INVITE',
        entityType: 'InviteToken',
        entityId: invite.id,
        actorId: (req as any).user.personnelId,
        details: JSON.stringify({ targetEmail: email })
      }
    });

    // In a real app, send email here. For now, just return token to admin to distribute manually.
    res.status(200).json({ message: 'Invite created', token });
  } catch (error) {
    console.error('Invite error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const activateSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  name: z.string().min(1),
  departmentId: z.string().min(1)
});

export const activateAccount = async (req: Request, res: Response) => {
  try {
    const parsed = activateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    const { token, password, name, departmentId } = parsed.data;

    // Verify token
    const invites = await prisma.inviteToken.findMany({
      where: { used: false, expiresAt: { gt: new Date() } }
    });

    let matchedInvite = null;
    for (const invite of invites) {
      if (await bcrypt.compare(token, invite.tokenHash)) {
        matchedInvite = invite;
        break;
      }
    }

    if (!matchedInvite) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Create personnel card and account user transaction
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark token as used
      await tx.inviteToken.update({
        where: { id: matchedInvite!.id },
        data: { used: true }
      });

      // 2. Create PersonnelCard
      const personnel = await tx.personnelCard.create({
        data: {
          name,
          email: matchedInvite!.email,
          role: matchedInvite!.role,
          departmentId
        }
      });

      // 3. Create AccountUser
      const account = await tx.accountUser.create({
        data: {
          email: matchedInvite!.email,
          passwordHash,
          personnelId: personnel.id,
          status: 'ACTIVE'
        }
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          action: 'ACTIVATE_ACCOUNT',
          entityType: 'AccountUser',
          entityId: account.id,
          actorId: personnel.id,
          details: JSON.stringify({ email: account.email })
        }
      });

      return { account, personnel };
    });

    res.status(200).json({ message: 'Account activated successfully' });
  } catch (error) {
    console.error('Activate error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


import { Request, Response } from 'express';
import { prisma } from '../lib/db';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, limit = 50 } = req.query;

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType: entityType as string } : {}),
        ...(entityId ? { entityId: entityId as string } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

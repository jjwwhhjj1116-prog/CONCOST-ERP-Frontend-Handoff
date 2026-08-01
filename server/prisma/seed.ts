import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SYNTHETIC_SEED_BLOCKED_IN_PRODUCTION');
  }
  if (process.env.ALLOW_SYNTHETIC_SEED !== 'true') {
    throw new Error('SYNTHETIC_SEED_REQUIRES_EXPLICIT_OPT_IN');
  }

  console.log('Starting synthetic demo seed...');

  // 1. Seed Personnel
  const dummyPersonnelPath = path.resolve(__dirname, '../../src/data/dummyPersonnel.json');
  if (fs.existsSync(dummyPersonnelPath)) {
    const data = JSON.parse(fs.readFileSync(dummyPersonnelPath, 'utf8'));
    if (data.synthetic !== true || !Array.isArray(data.personnel)) {
      throw new Error('SEED_REQUIRES_SYNTHETIC_PERSONNEL_DATASET');
    }
    for (const p of data.personnel) {
      const id = String(p.id || '');
      const email = String(p.email || '');
      if (!id.startsWith('demo-') || !email.endsWith('@example.invalid')) {
        throw new Error('SEED_PERSONNEL_MUST_USE_SYNTHETIC_IDENTIFIERS');
      }
      const personnel = await prisma.personnelCard.upsert({
        where: { id },
        update: {
          name: p.name || p.displayName || '',
          displayName: p.displayName,
          companyId: p.companyId,
          departmentId: p.departmentId || 'DEFAULT',
          role: p.role,
          systemRole: p.systemRole,
          employmentStatus: p.employmentStatus,
          isActive: p.isActive !== false,
          organizationRank: p.organizationRank,
          deputyApproverId: p.deputyApproverId,
          subDepartmentId: p.subDepartmentId,
        },
        create: {
          id: p.id,
          name: p.name || p.displayName || '',
          displayName: p.displayName,
          companyId: p.companyId,
          departmentId: p.departmentId || 'DEFAULT',
          role: p.role,
          systemRole: p.systemRole,
          employmentStatus: p.employmentStatus,
          isActive: p.isActive !== false,
          organizationRank: p.organizationRank,
          deputyApproverId: p.deputyApproverId,
          subDepartmentId: p.subDepartmentId,
        },
      });
      console.log(`Upserted synthetic personnel record: ${personnel.id}`);

      if (p.role === 'SUPER_ADMIN' && process.env.ALLOW_SYNTHETIC_AUTH_SEED === 'true') {
        await prisma.accountUser.upsert({
          where: { email },
          update: {
            personnelId: personnel.id,
          },
          create: {
            email,
            // Non-production synthetic account only. Production seed execution is blocked above.
            passwordHash: '$2a$10$T1KqL2O.Dq.4C3.8Kk4q4eH3iW3/y2iP3L9fS1qT3h1W.wP3I3q2O', 
            personnelId: personnel.id,
            status: 'ACTIVE',
          },
        });
        console.log(`Upserted synthetic account for personnel: ${personnel.id}`);
      }
    }
  } else {
    console.warn(`Seed file not found: ${dummyPersonnelPath}`);
  }

  console.log('Synthetic demo seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { z } from 'zod';

const importSchema = z.object({
  personnel: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional()
});

export const importData = async (req: Request, res: Response) => {
  try {
    const parsed = importSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });

    const userId = (req as any).user.personnelId;

    const result = await prisma.$transaction(async (tx) => {
      let recordsImported = 0;

      // Import personnel
      if (parsed.data.personnel && parsed.data.personnel.length > 0) {
        for (const p of parsed.data.personnel) {
          await tx.personnelCard.upsert({
            where: { id: p.id },
            update: { ...p },
            create: { ...p }
          });
          recordsImported++;
        }
      }

      // Import projects
      if (parsed.data.projects && parsed.data.projects.length > 0) {
        for (const prj of parsed.data.projects) {
          await tx.project.upsert({
            where: { id: prj.id },
            update: { ...prj },
            create: { ...prj }
          });
          recordsImported++;
        }
      }

      const run = await tx.importRun.create({
        data: {
          importedBy: userId,
          records: recordsImported,
          status: 'SUCCESS',
          details: 'JSON Bulk Import'
        }
      });

      return run;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

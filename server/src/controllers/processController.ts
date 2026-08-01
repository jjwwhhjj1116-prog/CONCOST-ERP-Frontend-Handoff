import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { z } from 'zod';

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await prisma.processTemplate.findMany({
      include: {
        stages: {
          include: {
            tasks: true
          }
        }
      }
    });
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const assignmentSubmitSchema = z.object({
  taskId: z.string().min(1),
  templateId: z.string().min(1),
  managerId: z.string().min(1),
  schedules: z.array(z.any())
});

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const parsed = assignmentSubmitSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });

    const pmId = (req as any).user.personnelId;

    const result = await prisma.$transaction(async (tx) => {
      // Create draft assignment
      const assignment = await tx.processTemplateAssignment.create({
        data: {
          taskId: parsed.data.taskId,
          templateId: parsed.data.templateId,
          pmId,
          managerId: parsed.data.managerId,
          status: 'PENDING_APPROVAL',
          schedules: {
            create: parsed.data.schedules.map((s: any) => ({
              processStageId: s.processStageId,
              processTaskId: s.processTaskId,
              startDate: new Date(s.startDate),
              endDate: new Date(s.endDate),
              assigneeId: s.assigneeId,
              status: s.status || 'PLANNED',
              progress: s.progress || 0,
              category: s.category || 'GENERAL'
            }))
          }
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'SUBMIT_ASSIGNMENT',
          entityType: 'ProcessTemplateAssignment',
          entityId: assignment.id,
          actorId: pmId,
        }
      });

      return assignment;
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const rejectAssignment = async (req: Request, res: Response) => {
  try {
    const assignmentId = req.params.assignmentId as string;
    const { rejectionReason } = req.body;
    const managerId = (req as any).user.personnelId;

    if (!rejectionReason) return res.status(400).json({ error: 'Rejection reason is required' });

    const assignment = await prisma.processTemplateAssignment.findUnique({ where: { id: assignmentId }, include: { schedules: true } });
    if (!assignment || assignment.status !== 'PENDING_APPROVAL') return res.status(400).json({ error: 'Invalid assignment state' });

    // Ensure manager
    if (assignment.managerId !== managerId) return res.status(403).json({ error: 'Forbidden' });

    const snapshot = JSON.stringify({
      status: assignment.status,
      schedules: assignment.schedules
    });

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.processTemplateAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'REJECTED',
          rejectionReason,
          historySnapshot: snapshot,
          reviewedBy: managerId,
          reviewedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'REJECT_ASSIGNMENT',
          entityType: 'ProcessTemplateAssignment',
          entityId: assignmentId,
          actorId: managerId,
          details: rejectionReason
        }
      });
      return updated;
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const approveAssignment = async (req: Request, res: Response) => {
  try {
    const assignmentId = req.params.assignmentId as string;
    const managerId = (req as any).user.personnelId;

    const assignment = await prisma.processTemplateAssignment.findUnique({
      where: { id: assignmentId },
      include: { schedules: true }
    });

    if (!assignment || assignment.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: 'Invalid assignment state' });
    }

    if (assignment.managerId !== managerId) return res.status(403).json({ error: 'Forbidden' });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update assignment status
      const updated = await tx.processTemplateAssignment.update({
        where: { id: assignmentId },
        data: {
          status: 'APPROVED',
          reviewedBy: managerId,
          reviewedAt: new Date(),
          rejectionReason: null
        }
      });

      // 2. Official schedule handoff
      // Mark process schedules as official
      await tx.processSchedule.updateMany({
        where: { assignmentId },
        data: { isOfficial: true }
      });

      // Create official TaskWorkSegments
      for (const schedule of assignment.schedules) {
        if (schedule.assigneeId) {
          const hours = (new Date(schedule.endDate).getTime() - new Date(schedule.startDate).getTime()) / (1000 * 60 * 60);
          await tx.taskWorkSegment.create({
            data: {
              taskId: assignment.taskId,
              workerId: schedule.assigneeId,
              date: schedule.startDate,
              hours: hours > 0 ? hours : 8,
              description: 'Official template process task'
            }
          });
        }
      }

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          action: 'APPROVE_ASSIGNMENT',
          entityType: 'ProcessTemplateAssignment',
          entityId: assignmentId,
          actorId: managerId
        }
      });

      return updated;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

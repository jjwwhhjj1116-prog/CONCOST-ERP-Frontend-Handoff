import { Request, Response } from 'express';
import { prisma } from '../lib/db';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const tasks = await prisma.task.findMany({
      where: projectId ? { projectId: projectId as string } : undefined,
      include: {
        assignee: true,
        workSegments: true
      }
    });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const project = (req as any).project; // Available via requireProjectOwnership guard
    
    const maxOrder = await prisma.task.aggregate({
      where: { projectId: project.id },
      _max: { orderIndex: true }
    });
    const orderIndex = (maxOrder._max.orderIndex || 0) + 1;

    const task = await prisma.task.create({
      data: {
        ...req.body,
        projectId: project.id,
        orderIndex,
        startDate: new Date(req.body.startDate),
        dueDate: new Date(req.body.dueDate)
      }
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const updateData = { ...req.body };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData
    });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// TaskWorkSegment CRUD
export const addWorkSegment = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const workerId = (req as any).user.personnelId;
    
    // Authorization: requireTaskAccess guard ensures user is allowed
    const segment = await prisma.taskWorkSegment.create({
      data: {
        taskId,
        workerId,
        date: new Date(req.body.date),
        hours: req.body.hours,
        description: req.body.description
      }
    });
    res.status(201).json(segment);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

import { Request, Response } from 'express';
import { prisma } from '../lib/db';

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.personnelId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.personnelId;
    const notificationId = req.params.notificationId as string;

    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId // Ensure ownership
      },
      data: { isRead: true }
    });

    res.status(200).json({ success: true, updatedCount: notification.count });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

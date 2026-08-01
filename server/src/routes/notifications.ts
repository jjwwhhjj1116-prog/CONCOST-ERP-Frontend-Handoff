import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { getMyNotifications, markAsRead } from '../controllers/notificationController';

const router = Router();

router.use(requireAuth);

router.get('/', getMyNotifications);
router.put('/:notificationId/read', markAsRead);

export default router;

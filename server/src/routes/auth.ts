import { Router } from 'express';
import { login, logout, getSession, createInvite, activateAccount } from '../controllers/authController';
import { requireAuth, requireSystemAdmin } from '../middlewares/auth';

const router = Router();

import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per `window` (here, per 15 minutes)
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/session', requireAuth, getSession);

// Admin routes
router.post('/invite', requireAuth, requireSystemAdmin, createInvite);

// Public routes
router.post('/activate', activateAccount);

export default router;

import { Router } from 'express';
import { requireAuth, requireSystemAdmin } from '../middlewares/auth';
import { getAuditLogs } from '../controllers/auditController';

const router = Router();

router.use(requireAuth);

// Only System/Super Admins or specific roles should view global audit logs
router.get('/', requireSystemAdmin, getAuditLogs);

export default router;

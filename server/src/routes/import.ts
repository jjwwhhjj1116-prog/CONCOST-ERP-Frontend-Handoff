import { Router } from 'express';
import { requireAuth, requireSystemAdmin } from '../middlewares/auth';
import { importData } from '../controllers/importController';

const router = Router();

router.use(requireAuth);

router.post('/', requireSystemAdmin, importData);

export default router;

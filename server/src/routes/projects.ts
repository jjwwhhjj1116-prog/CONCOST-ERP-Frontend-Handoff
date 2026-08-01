import { Router } from 'express';
import { createProject, getProject, getProjects, getProjectStats, updateProject } from '../controllers/projectController';
import { requireAuth, requireSystemAdmin } from '../middlewares/auth';
import { requireExplicitCompanyScope } from '../middlewares/explicitCompanyScope';
import { requireProjectOwnership } from '../middlewares/guards';

const router = Router();

router.use(requireAuth);

router.get('/', requireExplicitCompanyScope, getProjects);
router.get('/stats', requireExplicitCompanyScope, getProjectStats);
router.get('/:projectId', requireExplicitCompanyScope, getProject);
router.post('/', requireSystemAdmin, createProject);
router.put('/:projectId', requireProjectOwnership, updateProject);

export default router;

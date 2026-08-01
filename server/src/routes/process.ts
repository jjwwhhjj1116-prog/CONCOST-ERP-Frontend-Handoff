import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { requireProcessAssignmentOwnership } from '../middlewares/guards';
import { getTemplates, submitAssignment, rejectAssignment, approveAssignment } from '../controllers/processController';

const router = Router();

router.use(requireAuth);

router.get('/templates', getTemplates);

// PM submits assignment
router.post('/assignments', submitAssignment);

// Manager actions on assignment
router.post('/assignments/:assignmentId/reject', requireProcessAssignmentOwnership, rejectAssignment);
router.post('/assignments/:assignmentId/approve', requireProcessAssignmentOwnership, approveAssignment);

export default router;

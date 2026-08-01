import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { requireProjectOwnership, requireTaskAccess } from '../middlewares/guards';
import { getTasks, createTask, updateTask, addWorkSegment } from '../controllers/taskController';

const router = Router();

router.use(requireAuth);

router.get('/', getTasks);
// Creating a task requires PM or Manager ownership of the parent project
router.post('/', requireProjectOwnership, createTask);

// Updating a task requires task access (Assignee or PM/Manager)
router.put('/:taskId', requireTaskAccess, updateTask);

// WorkSegments
router.post('/:taskId/work-segments', requireTaskAccess, addWorkSegment);

export default router;

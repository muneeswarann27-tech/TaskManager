import { Router } from 'express';
import { createTask, getTasks, updateTask, deleteTask } from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all task routes
router.use(authenticateToken as any);

// /api/tasks
router.post('/', createTask as any);
router.get('/', getTasks as any);
router.put('/:id', updateTask as any);
router.delete('/:id', deleteTask as any);

export default router;

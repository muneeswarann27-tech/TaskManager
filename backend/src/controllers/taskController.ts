import { Response } from 'express';
import { Task } from '../models/Task';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

// Create Task
export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status, priority, due_date } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const task = await Task.create({
      user_id: userId,
      title,
      description: description || null,
      status: status || 'pending',
      priority: priority || 'medium',
      due_date: due_date || null
    });

    return res.status(201).json({
      message: 'Task created successfully',
      task: task.toJSON(),
    });
  } catch (error: any) {
    console.error('Create task error:', error);
    return res.status(500).json({ message: 'Server error during task creation', error: error.message });
  }
};

// Get Tasks for logged-in user
export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { status, priority, search } = req.query;

    const whereClause: any = { user_id: userId };

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const tasks = await Task.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    return res.json(tasks);
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ message: 'Server error during task retrieval', error: error.message });
  }
};

// Update Task
export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify task exists and belongs to user
    const task = await Task.findOne({ where: { id, user_id: userId } });

    if (!task) {
      const taskExists = await Task.findByPk(id);
      if (!taskExists) {
        return res.status(404).json({ message: 'Task not found' });
      }
      return res.status(403).json({ message: 'Access denied. This task does not belong to you.' });
    }

    const fieldsToUpdate: any = {};
    if (title !== undefined) fieldsToUpdate.title = title;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (status !== undefined) fieldsToUpdate.status = status;
    if (priority !== undefined) fieldsToUpdate.priority = priority;
    if (due_date !== undefined) fieldsToUpdate.due_date = due_date;

    await task.update(fieldsToUpdate);

    return res.json({
      message: 'Task updated successfully',
      task: task.toJSON(),
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    return res.status(500).json({ message: 'Server error during task update', error: error.message });
  }
};

// Delete Task
export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify task exists and belongs to user
    const task = await Task.findOne({ where: { id, user_id: userId } });

    if (!task) {
      const taskExists = await Task.findByPk(id);
      if (!taskExists) {
        return res.status(404).json({ message: 'Task not found' });
      }
      return res.status(403).json({ message: 'Access denied. This task does not belong to you.' });
    }

    await task.destroy();

    return res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return res.status(500).json({ message: 'Server error during task deletion', error: error.message });
  }
};

import express from 'express';
import { Task } from '../models/Task';
import { auth, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(auth);

const formatTask = (t: any) => {
  const obj = t.toObject ? t.toObject() : t;
  return {
    ...obj,
    id: (obj._id || obj.id).toString(),
    created_at: obj.createdAt,
    updated_at: obj.updatedAt,
  };
};

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, status, priority, sortBy, sortOrder } = req.query;
    let query: any = { user_id: req.user?.id };

    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortFieldMap: Record<string, string> = {
      created_at: 'createdAt',
      createdAt: 'createdAt',
      due_date: 'due_date',
    };
    const sortConfig: any = {};
    const sortField = sortFieldMap[sortBy as string] || (sortBy as string) || 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    sortConfig[sortField] = sortDir;

    const tasks = await Task.find(query).sort(sortConfig);
    res.json(tasks.map(formatTask));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const tasks = await Task.find({ user_id: req.user?.id }).select('status');
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    res.json({ total, pending, inProgress, completed, completionRate });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recent', async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const tasks = await Task.find({ user_id: req.user?.id })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(tasks.map(formatTask));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user_id: req.user?.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(formatTask(task));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const task = new Task({ ...req.body, user_id: req.user?.id });
    await task.save();
    res.status(201).json(formatTask(task));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user?.id },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(formatTask(task));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user_id: req.user?.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

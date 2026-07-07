import Task from '../models/Task.js';
import User from '../models/User.js';
import { AppError } from '../utils/appError.js';

export const listTasks = async ({ authorId, status, priority, category, page = 1, limit = 50 }) => {
  const filter = { author: authorId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ priority: -1, dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter)
  ]);

  return {
    tasks: tasks.map((t) => t.toTaskJSON()),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  };
};

export const createTask = async (userId, payload) => {
  const task = await Task.create({
    ...payload,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
    author: userId
  });

  await User.findByIdAndUpdate(userId, { $inc: { 'stats.tasksCreated': 1 } });

  return task.toTaskJSON();
};

export const updateTask = async (taskId, userId, payload) => {
  const task = await Task.findById(taskId);

  if (!task) throw new AppError('Task not found.', 404);
  if (task.author.toString() !== userId.toString()) throw new AppError('You can only edit your own tasks.', 403);

  const wasNotCompleted = task.status !== 'completed';
  const becomingCompleted = payload.status === 'completed';

  if (payload.title !== undefined) task.title = payload.title;
  if (payload.description !== undefined) task.description = payload.description;
  if (payload.dueDate !== undefined) task.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  if (payload.priority !== undefined) task.priority = payload.priority;
  if (payload.status !== undefined) task.status = payload.status;
  if (payload.category !== undefined) task.category = payload.category;

  if (wasNotCompleted && becomingCompleted) {
    task.completedAt = new Date();
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.tasksCompleted': 1 } });
  }

  if (!becomingCompleted && task.completedAt) {
    task.completedAt = null;
    if (wasNotCompleted) {
      await User.findByIdAndUpdate(userId, { $inc: { 'stats.tasksCompleted': -1 } });
    }
  }

  await task.save();
  return task.toTaskJSON();
};

export const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);

  if (!task) throw new AppError('Task not found.', 404);
  if (task.author.toString() !== userId.toString()) throw new AppError('You can only delete your own tasks.', 403);

  if (task.status === 'completed') {
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.tasksCompleted': -1 } });
  }

  await User.findByIdAndUpdate(userId, { $inc: { 'stats.tasksCreated': -1 } });

  await Task.deleteOne({ _id: taskId });
  return { message: 'Task deleted successfully.' };
};

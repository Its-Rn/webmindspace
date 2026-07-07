import { asyncHandler } from '../utils/asyncHandler.js';
import { listTasks, createTask, updateTask, deleteTask } from '../services/task.service.js';

export const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, category, page, limit } = req.query;
  const result = await listTasks({
    authorId: req.user._id,
    status,
    priority,
    category,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 50
  });

  res.status(200).json({ success: true, message: 'Tasks fetched successfully.', data: result });
});

export const createNewTask = asyncHandler(async (req, res) => {
  const task = await createTask(req.user._id, req.body);

  res.status(201).json({ success: true, message: 'Task created successfully.', data: { task } });
});

export const updateExistingTask = asyncHandler(async (req, res) => {
  const task = await updateTask(req.params.id, req.user._id, req.body);

  res.status(200).json({ success: true, message: 'Task updated successfully.', data: { task } });
});

export const deleteExistingTask = asyncHandler(async (req, res) => {
  const result = await deleteTask(req.params.id, req.user._id);

  res.status(200).json({ success: true, message: result.message, data: null });
});

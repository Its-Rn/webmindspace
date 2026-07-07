import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiEdit3,
  FiFlag,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiZap
} from 'react-icons/fi';

import { taskService } from '../../services/task';

const priorityColors = {
  high: 'text-red-500 bg-red-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  low: 'text-slate-500 bg-slate-500/10'
};

const statusColors = {
  completed: 'text-emerald-500 bg-emerald-500/10',
  'in-progress': 'text-cyan-500 bg-cyan-500/10',
  pending: 'text-slate-500 bg-slate-500/10'
};

const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));
};

const TaskForm = ({ initial, onSave, isSaving }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 16) : '');
  const [priority, setPriority] = useState(initial?.priority || 'medium');
  const [category, setCategory] = useState(initial?.category || '');
  const [status, setStatus] = useState(initial?.status || 'pending');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      priority,
      category: category.trim(),
      status
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title *"
        className="input-shell text-lg font-semibold"
        autoFocus
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="input-shell min-h-[80px] resize-y"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-500">Due date</span>
          <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-shell" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-500">Priority</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-shell">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-500">Category</span>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Work, personal, etc." className="input-shell" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-500">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-shell">
            <option value="pending">Pending</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={!title.trim() || isSaving} className="primary-button">
          <FiZap /> {isSaving ? 'Saving...' : initial ? 'Update task' : 'Create task'}
        </button>
      </div>
    </form>
  );
};

export const TasksPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const tasksQuery = useQuery({
    queryKey: ['tasks', { status: filterStatus === 'all' ? undefined : filterStatus, priority: filterPriority === 'all' ? undefined : filterPriority }],
    queryFn: () => taskService.listTasks({
      status: filterStatus === 'all' ? undefined : filterStatus,
      priority: filterPriority === 'all' ? undefined : filterPriority
    }),
    staleTime: 30 * 1000
  });

  const createMutation = useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); setShowForm(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => taskService.updateTask(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); setEditingTask(null); setShowForm(false); }
  });

  const deleteMutation = useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); queryClient.invalidateQueries({ queryKey: ['dashboard'] }); }
  });

  const tasks = tasksQuery.data?.data?.tasks || [];
  const query = search.trim().toLowerCase();

  const filteredTasks = useMemo(() => {
    if (!query) return tasks;
    return tasks.filter((t) =>
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.category?.toLowerCase().includes(query)
    );
  }, [query, tasks]);

  const openEdit = (task) => { setEditingTask(task); setShowForm(true); };

  const handleSave = (payload) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateMutation.mutate({ id: task.id, payload: { status: newStatus } });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="surface-card overflow-hidden p-6 sm:p-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
              <FiCheckCircle />
            </div>
            <div>
              <p className="section-label w-fit">Task planner</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Stay on top of your day.
              </h2>
            </div>
          </div>
          <div className="flex gap-3">
            <Link className="secondary-button" to="/calendar">
              <FiCalendar />
              Calendar view
            </Link>
            <button type="button" className="primary-button" onClick={() => { setEditingTask(null); setShowForm(true); }}>
              <FiPlus />
              New task
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="input-shell pl-11" />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'in-progress', 'completed'].map((s) => (
              <button key={s} type="button" onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                  filterStatus === s ? 'bg-cyan-500/10 text-cyan-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >{s === 'in-progress' ? 'In progress' : s}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {['all', 'high', 'medium', 'low'].map((p) => (
              <button key={p} type="button" onClick={() => setFilterPriority(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                  filterPriority === p ? 'bg-cyan-500/10 text-cyan-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >{p}</button>
            ))}
          </div>
        </div>
      </motion.section>

      {showForm && (
        <div className="surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 mb-4">
            {editingTask ? 'Edit task' : 'Create task'}
          </p>
          <TaskForm initial={editingTask} onSave={handleSave} isSaving={isSaving} />
        </div>
      )}

      {tasksQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <FiCheckCircle className="mx-auto text-4xl text-slate-400" />
          <h3 className="mt-4 font-display text-xl font-semibold text-slate-950 dark:text-white">
            {query ? 'No tasks match your search' : 'No tasks yet'}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {query ? 'Try a different search or filter.' : 'Create your first task to get started.'}
          </p>
          {!query && <button type="button" className="primary-button mt-6" onClick={() => { setEditingTask(null); setShowForm(true); }}><FiPlus /> Create task</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`surface-card flex items-center gap-4 px-5 py-4 ${task.status === 'completed' ? 'opacity-60' : ''}`}
            >
              <button
                type="button"
                onClick={() => toggleComplete(task)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  task.status === 'completed' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-cyan-400'
                }`}
              >
                {task.status === 'completed' && <FiCheckCircle className="text-xs" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-950 dark:text-white'}`}>
                    {task.title}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[task.status]}`}>
                    {task.status === 'in-progress' ? 'In progress' : task.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <FiCalendar className="text-xs" /> {formatDate(task.dueDate)}
                    </span>
                  )}
                  {task.category && (
                    <span className="text-xs text-slate-400">{task.category}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => openEdit(task)} className="p-2 rounded-lg text-slate-400 hover:text-cyan-500 transition-colors" title="Edit">
                  <FiEdit3 className="text-sm" />
                </button>
                <button type="button" onClick={() => { if (window.confirm('Delete this task?')) deleteMutation.mutate(task.id); }} className="p-2 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

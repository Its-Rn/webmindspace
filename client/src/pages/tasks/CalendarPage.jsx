import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiList,
  FiZap
} from 'react-icons/fi';

import { taskService } from '../../services/task';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getMonthGrid = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startPad + 1;
    cells.push({
      day: dayNum > 0 && dayNum <= daysInMonth ? dayNum : null,
      date: dayNum > 0 && dayNum <= daysInMonth ? new Date(year, month, dayNum) : null,
      isToday: dayNum > 0 && dayNum <= daysInMonth &&
        dayNum === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
    });
  }
  return cells;
};

const formatMonth = (year, month) => {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month));
};

const toDateKey = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const CalendarPage = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.listTasks(),
    staleTime: 30 * 1000
  });

  const tasks = tasksQuery.data?.data?.tasks || [];

  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      if (task.dueDate) {
        const key = toDateKey(task.dueDate);
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    });
    return map;
  }, [tasks]);

  const cells = getMonthGrid(year, month);

  const prevMonth = () => { if (month === 0) { setYear(year - 1); setMonth(11); } else { setMonth(month - 1); } };
  const nextMonth = () => { if (month === 11) { setYear(year + 1); setMonth(0); } else { setMonth(month + 1); } };

  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

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
              <FiCalendar />
            </div>
            <div>
              <p className="section-label w-fit">Calendar planner</p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Your schedule at a glance.
              </h2>
            </div>
          </div>
          <Link className="secondary-button" to="/tasks">
            <FiList />
            List view
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <FiChevronLeft />
            </button>
            <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-white min-w-[200px] text-center">
              {formatMonth(year, month)}
            </h3>
            <button type="button" onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <FiChevronRight />
            </button>
          </div>
          <button type="button" onClick={goToday} className="nav-chip">
            <FiZap /> Today
          </button>
        </div>
      </motion.section>

      <div className="surface-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[rgb(var(--border))]">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const dateKey = cell.date ? toDateKey(cell.date) : '';
            const dayTasks = tasksByDate[dateKey] || [];

            return (
              <div
                key={idx}
                className={`min-h-[100px] border-b border-r border-[rgb(var(--border))] p-2 ${
                  !cell.day ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''
                } ${cell.isToday ? 'bg-cyan-500/5' : ''}`}
              >
                {cell.day && (
                  <>
                    <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                      cell.isToday ? 'bg-cyan-500 text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}>
                      {cell.day}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <Link
                          key={task.id}
                          to="/tasks"
                          className={`block truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            task.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 line-through'
                              : task.priority === 'high'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                          }`}
                        >
                          {task.title}
                        </Link>
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="block text-[10px] text-slate-400 px-1">+{dayTasks.length - 3} more</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

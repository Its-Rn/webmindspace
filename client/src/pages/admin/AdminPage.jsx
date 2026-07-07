import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiMessageSquare,
  FiSettings,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiZap,
  FiAlertCircle,
  FiArrowRight,
  FiBarChart2,
} from 'react-icons/fi';
import { adminApi } from '../../services/admin';

/* ─── animation helpers ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ─── skeleton loader ─── */
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700/60 ${className}`} />
);

const AdminPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-10 w-36" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        {/* Table skeleton */}
        <Skeleton className="h-72" />
      </div>
    );
  }

  /* ── Error state ── */
  if (isError) {
    return (
      <div className="surface-card flex flex-col items-center gap-4 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
          <FiAlertCircle className="text-2xl" />
        </div>
        <p className="font-display text-xl font-semibold text-slate-950 dark:text-white">Failed to load stats</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Check your connection and try refreshing.</p>
      </div>
    );
  }

  const stats = data?.data?.data;
  if (!stats) return null;

  /* ── Data ── */
  const statCards = [
    { label: 'Total Users',     value: stats.counts.users,         icon: FiUsers,        color: 'from-cyan-400 to-blue-500',      bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
    { label: 'Active (7d)',     value: stats.counts.activeUsers,   icon: FiActivity,     color: 'from-emerald-400 to-teal-500',   bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'Blog Posts',      value: stats.counts.posts,         icon: FiBookOpen,     color: 'from-amber-400 to-orange-500',   bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { label: 'Timeline Posts',  value: stats.counts.timelinePosts, icon: FiClock,        color: 'from-violet-400 to-purple-500',  bg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    { label: 'Tasks',           value: stats.counts.tasks,         icon: FiCheckCircle,  color: 'from-sky-400 to-cyan-500',       bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
    { label: 'Notes',           value: stats.counts.notes,         icon: FiFileText,     color: 'from-rose-400 to-pink-500',      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    { label: 'Messages',        value: stats.counts.messages,      icon: FiMessageSquare,color: 'from-emerald-400 to-teal-500',   bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'Conversations',   value: stats.counts.conversations, icon: FiMessageSquare,color: 'from-indigo-400 to-violet-500',  bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    { label: 'Notifications',   value: stats.counts.notifications, icon: FiZap,          color: 'from-amber-400 to-yellow-500',   bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  ];

  const totalCards = [
    { label: 'Tasks Completed', value: stats.totals.totalTasksCompleted,  icon: FiCheckCircle,   accent: 'from-cyan-400 to-sky-500' },
    { label: 'Blogs Published', value: stats.totals.totalBlogsPublished,  icon: FiBookOpen,      accent: 'from-amber-400 to-orange-500' },
    { label: 'Notes Created',   value: stats.totals.totalNotesCreated,    icon: FiFileText,      accent: 'from-violet-400 to-fuchsia-500' },
    { label: 'Messages Sent',   value: stats.totals.totalMessagesSent,    icon: FiMessageSquare, accent: 'from-emerald-400 to-teal-500' },
  ];

  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════
          SECTION 1 — Page Header
      ══════════════════════════════════════ */}
      <motion.div {...fadeUp(0)} className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
            <FiShield className="text-xl" />
          </div>
          <div>
            <p className="section-label mb-1">Control Panel</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Admin Dashboard
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => navigate('/admin/settings')}
            className="secondary-button shrink-0"
          >
            <FiSettings />
            Site Settings
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="primary-button shrink-0"
          >
            <FiUsers />
            Manage Users
            <FiArrowRight />
          </button>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════
          SECTION 2 — Platform Stats Grid
      ══════════════════════════════════════ */}
      <motion.section {...fadeUp(0.06)}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <FiBarChart2 />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Overview</p>
            <h2 className="font-display text-lg font-semibold text-slate-950 dark:text-white">Platform Statistics</h2>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:grid-cols-3">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 + i * 0.04 }}
                className="surface-card p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">{card.label}</p>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="mt-3 font-display text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">
                  {(card.value ?? 0).toLocaleString()}
                </p>
                <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className={`h-1 rounded-full bg-gradient-to-r ${card.color}`}
                    style={{ width: `${Math.min(100, Math.max(8, (card.value / Math.max(...statCards.map(c => c.value || 1))) * 100))}%` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ══════════════════════════════════════
          SECTION 3 — Aggregate Activity
      ══════════════════════════════════════ */}
      <motion.section {...fadeUp(0.12)}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FiTrendingUp />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Workspace Totals</p>
            <h2 className="font-display text-lg font-semibold text-slate-950 dark:text-white">Aggregate Activity</h2>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {totalCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.14 + i * 0.05 }}
                className="surface-card p-5 flex items-center gap-4"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-slate-950 shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{card.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-slate-950 dark:text-white">
                    {(card.value ?? 0).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ══════════════════════════════════════
          SECTION 4 — Recent Users Table
      ══════════════════════════════════════ */}
      <motion.section {...fadeUp(0.18)}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <FiUsers />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Latest signups</p>
              <h2 className="font-display text-lg font-semibold text-slate-950 dark:text-white">Recent Users</h2>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/users')}
            className="secondary-button shrink-0 hidden sm:inline-flex"
          >
            View all
            <FiArrowRight />
          </button>
        </div>

        {/* Desktop table */}
        <div className="surface-card overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))]">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">User</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Email</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Role</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {stats.recentUsers.map((u) => (
                  <tr key={u._id} className="transition-colors hover:bg-[rgb(var(--surface-soft))]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-white shadow-sm">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-semibold text-slate-950 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.role === 'admin'
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                          : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                      }`}>
                        {u.role === 'admin' && <FiShield className="mr-1 h-3 w-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${
                        u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile card list */}
        <div className="space-y-3 sm:hidden">
          {stats.recentUsers.map((u) => (
            <div key={u._id} className="surface-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white">
                  {u.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-950 dark:text-white truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  u.role === 'admin'
                    ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                    : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                }`}>
                  {u.role}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className={`flex items-center gap-1.5 font-medium ${u.isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                  <span className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
                <span>Joined {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          ))}
          <button
            onClick={() => navigate('/admin/users')}
            className="secondary-button w-full"
          >
            View all users <FiArrowRight />
          </button>
        </div>
      </motion.section>
    </div>
  );
};

export default AdminPage;

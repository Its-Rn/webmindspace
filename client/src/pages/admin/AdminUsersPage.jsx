import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiShield,
  FiToggleLeft,
  FiToggleRight,
  FiUsers,
  FiAlertCircle,
  FiX,
  FiCheck,
  FiPlus,
  FiUser,
  FiMail,
  FiLock,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/admin';

/* ─── skeleton ─── */
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700/60 ${className}`} />
);

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { type, userId, userName }
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', isEmailVerified: false, isActive: true });
  const [formError, setFormError] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.getUsers({ page, limit: 20, search: search || undefined }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (userId) => adminApi.toggleUserActive(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setConfirmAction(null);
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: (userId) => adminApi.toggleUserAdmin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setConfirmAction(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setShowCreateModal(false);
      setForm({ name: '', email: '', password: '', role: 'user', isEmailVerified: false, isActive: true });
      setFormError('');
    },
    onError: (error) => {
      setFormError(error?.response?.data?.message || 'Failed to create user');
    },
  });

  const result = data?.data?.data;
  const users = result?.users || [];
  const pagination = result?.pagination || {};

  const handleAction = (type, userId, userName) => {
    setConfirmAction({ type, userId, userName });
  };

  const confirmMutation =
    confirmAction?.type === 'toggle-active'
      ? () => toggleActiveMutation.mutate(confirmAction.userId)
      : () => toggleAdminMutation.mutate(confirmAction.userId);

  const isPending = toggleActiveMutation.isPending || toggleAdminMutation.isPending;

  return (
    <div className="space-y-8">

      {/* ══════════════════════════════════════
          SECTION 1 — Page Header
      ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text))] transition-all duration-200 hover:border-cyan-400/40 hover:-translate-y-0.5 active:scale-95"
            aria-label="Back to admin"
          >
            <FiArrowLeft />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
              <FiUsers className="text-xl" />
            </div>
            <div>
              <p className="section-label mb-1">Admin Panel</p>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                User Management
              </h1>
            </div>
          </div>
        </div>

        {/* Live count badge */}
        {!isLoading && pagination.total != null && (
          <div className="surface-card flex items-center gap-3 self-start rounded-2xl p-3 sm:self-auto">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <FiUsers />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total users</p>
              <p className="font-display text-xl font-bold text-slate-950 dark:text-white">{pagination.total?.toLocaleString()}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ══════════════════════════════════════
          SECTION 2 — Search Bar
      ══════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
            <FiSearch className="text-sm" />
          </div>
          <h2 className="font-display text-base font-semibold text-slate-950 dark:text-white">Search & Filter</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="surface-card flex flex-1 items-center gap-3 p-3 sm:p-4">
            <FiSearch className="shrink-0 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="flex-1 bg-transparent text-sm text-[rgb(var(--text))] outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 transition-all hover:bg-slate-200 dark:hover:bg-slate-600"
                aria-label="Clear search"
              >
                <FiX className="text-sm" />
              </button>
            )}
          </div>
          <button
            onClick={() => { setFormError(''); setShowCreateModal(true); }}
            className="primary-button shrink-0"
          >
            <FiPlus /> Create User
          </button>
        </div>
      </motion.section>

      {/* ══════════════════════════════════════
          SECTION 3 — Users Table / Cards
      ══════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <FiShield className="text-sm" />
          </div>
          <h2 className="font-display text-base font-semibold text-slate-950 dark:text-white">
            {search ? `Results for "${search}"` : 'All Users'}
          </h2>
          {pagination.total != null && (
            <span className="nav-chip ml-auto">{pagination.total} total</span>
          )}
        </div>

        {/* ─── Loading ─── */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        )}

        {/* ─── Error ─── */}
        {isError && (
          <div className="surface-card flex flex-col items-center gap-4 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <FiAlertCircle className="text-2xl" />
            </div>
            <p className="font-semibold text-slate-950 dark:text-white">Failed to load users</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Please refresh and try again.</p>
          </div>
        )}

        {/* ─── Desktop Table ─── */}
        {!isLoading && !isError && (
          <>
            <div className="surface-card overflow-hidden hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))]">
                      {['User', 'Email', 'Role', 'Status', 'Streak', 'Actions'].map((h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 ${i === 5 ? 'text-right' : 'text-left'}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--border))]">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400">
                          No users found{search ? ` matching "${search}"` : ''}.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr
                          key={u._id}
                          className="transition-colors duration-150 hover:bg-[rgb(var(--surface-soft))]"
                        >
                          {/* User */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-white shadow-sm">
                                {u.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span className="font-semibold text-slate-950 dark:text-white whitespace-nowrap">{u.name}</span>
                            </div>
                          </td>
                          {/* Email */}
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400 max-w-[180px] truncate">{u.email}</td>
                          {/* Role */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              u.role === 'admin'
                                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                            }`}>
                              {u.role === 'admin' && <FiShield className="h-3 w-3" />}
                              {u.role}
                            </span>
                          </td>
                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`flex items-center gap-1.5 text-xs font-medium ${
                              u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                            }`}>
                              <span className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          {/* Streak */}
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-950 dark:text-white">
                              {u.dailyStreak || 0}
                              <span className="text-xs font-normal text-slate-400">days</span>
                            </span>
                          </td>
                          {/* Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleAction('toggle-active', u._id, u.name)}
                                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                                  u.isActive
                                    ? 'border-emerald-200 bg-emerald-500/10 text-emerald-600 hover:border-emerald-300 dark:border-emerald-700 dark:text-emerald-400'
                                    : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-slate-400 hover:border-cyan-400/30'
                                }`}
                                title={u.isActive ? 'Deactivate user' : 'Activate user'}
                              >
                                {u.isActive ? <FiToggleRight className="text-base" /> : <FiToggleLeft className="text-base" />}
                              </button>
                              <button
                                onClick={() => handleAction('toggle-admin', u._id, u.name)}
                                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                                  u.role === 'admin'
                                    ? 'border-violet-200 bg-violet-500/10 text-violet-600 hover:border-violet-300 dark:border-violet-700 dark:text-violet-400'
                                    : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-slate-400 hover:border-violet-400/30'
                                }`}
                                title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                              >
                                <FiShield className="text-base" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── Mobile Card List ─── */}
            <div className="space-y-3 sm:hidden">
              {users.length === 0 ? (
                <div className="surface-card p-8 text-center">
                  <p className="font-semibold text-slate-950 dark:text-white">No users found</p>
                  {search && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try a different search term.</p>
                  )}
                </div>
              ) : (
                users.map((u) => (
                  <div key={u._id} className="surface-card p-4">
                    {/* Top row */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-bold text-white">
                        {u.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-950 dark:text-white truncate">{u.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                      </div>
                      {/* Role badge */}
                      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.role === 'admin'
                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                          : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                      }`}>
                        {u.role === 'admin' && <FiShield className="h-3 w-3" />}
                        {u.role}
                      </span>
                    </div>

                    {/* Bottom row */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`flex items-center gap-1.5 font-medium ${u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                          <span className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 dark:text-slate-400">{u.dailyStreak || 0} day streak</span>
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAction('toggle-active', u._id, u.name)}
                          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 ${
                            u.isActive
                              ? 'border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                              : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-slate-400'
                          }`}
                        >
                          {u.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                        </button>
                        <button
                          onClick={() => handleAction('toggle-admin', u._id, u.name)}
                          className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all active:scale-95 ${
                            u.role === 'admin'
                              ? 'border-violet-200 bg-violet-500/10 text-violet-600 dark:border-violet-700 dark:text-violet-400'
                              : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-slate-400'
                          }`}
                        >
                          <FiShield />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </motion.section>

      {/* ══════════════════════════════════════
          SECTION 4 — Pagination
      ══════════════════════════════════════ */}
      {pagination.pages > 1 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="surface-card flex items-center justify-between gap-4 px-5 py-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="secondary-button disabled:pointer-events-none disabled:opacity-30"
            >
              <FiChevronLeft />
              Previous
            </button>

            <div className="text-center">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                Page {pagination.page} <span className="font-normal text-slate-400">of</span> {pagination.pages}
              </p>
              {pagination.total != null && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{pagination.total} users total</p>
              )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="secondary-button disabled:pointer-events-none disabled:opacity-30"
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        </motion.section>
      )}

      {/* ══════════════════════════════════════
          CONFIRM ACTION MODAL
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {confirmAction && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmAction(null)}
              className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm"
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full"
            >
              <div className={`flex h-14 w-14 mx-auto items-center justify-center rounded-2xl ${
                confirmAction.type === 'toggle-active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-violet-500/10 text-violet-600'
              }`}>
                {confirmAction.type === 'toggle-active' ? <FiToggleRight className="text-2xl" /> : <FiShield className="text-2xl" />}
              </div>

              <div className="mt-4 text-center">
                <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-white">
                  {confirmAction.type === 'toggle-active' ? 'Toggle User Status' : 'Toggle Admin Role'}
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {confirmAction.type === 'toggle-active'
                    ? `Change the active status for `
                    : `Change the admin role for `}
                  <span className="font-semibold text-slate-950 dark:text-white">{confirmAction.userName}</span>?
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="secondary-button flex-1"
                >
                  <FiX /> Cancel
                </button>
                <button
                  onClick={confirmMutation}
                  disabled={isPending}
                  className="primary-button flex-1"
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                      Applying...
                    </span>
                  ) : (
                    <><FiCheck /> Confirm</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          CREATE USER MODAL
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
                <FiUser className="text-2xl" />
              </div>

              <div className="mt-4 text-center">
                <h3 className="font-display text-xl font-semibold text-slate-950 dark:text-white">Create User</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add a new user account.</p>
              </div>

              {formError && (
                <div className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-center text-sm font-medium text-rose-500">
                  {formError}
                </div>
              )}

              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.name.trim() || !form.email.trim() || !form.password) {
                    setFormError('All fields are required.');
                    return;
                  }
                  if (form.password.length < 8) {
                    setFormError('Password must be at least 8 characters.');
                    return;
                  }
                  setFormError('');
                  createMutation.mutate(form);
                }}
              >
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</label>
                  <div className="relative">
                    <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input-shell pl-11"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</label>
                  <div className="relative">
                    <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-shell pl-11"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
                  <div className="relative">
                    <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="input-shell pl-11"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950 dark:text-white">Admin role</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Grant admin privileges</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: form.role === 'admin' ? 'user' : 'admin' })}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
                      form.role === 'admin'
                        ? 'border-violet-200 bg-violet-500/10 text-violet-600 dark:border-violet-700 dark:text-violet-400'
                        : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-slate-400'
                    }`}
                  >
                    <FiShield />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950 dark:text-white">Email verified</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Skip email verification</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isEmailVerified: !form.isEmailVerified })}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
                      form.isEmailVerified
                        ? 'border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                        : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-slate-400'
                    }`}
                  >
                    {form.isEmailVerified ? <FiCheck /> : <FiX />}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950 dark:text-white">Active</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Account can sign in</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
                      form.isActive
                        ? 'border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                        : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-slate-400'
                    }`}
                  >
                    {form.isActive ? <FiCheck /> : <FiX />}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="secondary-button flex-1"
                  >
                    <FiX /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="primary-button flex-1"
                  >
                    {createMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        Creating...
                      </span>
                    ) : (
                      <><FiUser /> Create</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsersPage;

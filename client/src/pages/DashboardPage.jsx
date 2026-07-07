import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FiActivity,
  FiArrowUpRight,
  FiBarChart2,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCompass,
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiZap
} from 'react-icons/fi';

import { dashboardService } from '../services/dashboard';

const upcomingTasks = [
  {
    title: 'Publish landing page follow-up',
    time: '10:30 AM',
    state: 'High priority',
    category: 'Marketing',
    detail: 'Finalize copy, review analytics, and launch the next content pass.',
    accent: 'from-cyan-400 to-sky-500'
  },
  {
    title: 'Review dashboard layout',
    time: '12:15 PM',
    state: 'Medium priority',
    category: 'Design',
    detail: 'Validate spacing, card rhythm, and visual hierarchy.',
    accent: 'from-violet-400 to-fuchsia-500'
  },
  {
    title: 'Reply to product thread',
    time: '4:00 PM',
    state: 'Unread message',
    category: 'Communication',
    detail: 'Share the latest progress and unblock the conversation.',
    accent: 'from-emerald-400 to-teal-500'
  },
  {
    title: 'Capture end-of-day notes',
    time: '8:15 PM',
    state: 'Personal reflection',
    category: 'Journal',
    detail: "Log wins, blockers, and tomorrow's focus.",
    accent: 'from-amber-400 to-orange-500'
  }
];

const staticNotifications = [
  {
    title: 'Task reminder',
    meta: 'Plan evening run at 6:00 PM',
    tone: 'amber',
    unread: true,
    icon: FiBell
  },
  {
    title: 'New message',
    meta: 'Maya replied in Product Ops',
    tone: 'cyan',
    unread: true,
    icon: FiMessageSquare
  },
  {
    title: 'Blog comment',
    meta: 'Feedback arrived on the landing page draft',
    tone: 'violet',
    unread: false,
    icon: FiBookOpen
  },
  {
    title: 'Mention',
    meta: 'You were tagged in a timeline post',
    tone: 'emerald',
    unread: false,
    icon: FiActivity
  }
];

const quickActions = [
  {
    id: 'new-task',
    label: 'New task',
    phase: 'Phase 8',
    description: 'Queue a new task and set a reminder for the day.',
    icon: FiPlus,
    accent: 'from-cyan-400 to-sky-500'
  },
  {
    id: 'write-note',
    label: 'Write note',
    phase: 'Phase 11',
    description: 'Capture a thought before it slips away.',
    icon: FiCompass,
    accent: 'from-violet-400 to-fuchsia-500'
  },
  {
    id: 'draft-blog',
    label: 'Draft blog',
    phase: 'Phase 6',
    description: 'Open the publishing workflow for a new post.',
    icon: FiBookOpen,
    accent: 'from-amber-400 to-orange-500'
  },
  {
    id: 'open-chat',
    label: 'Open chat',
    phase: 'Phase 9',
    description: 'Jump into the conversation thread and reply fast.',
    icon: FiMessageSquare,
    accent: 'from-emerald-400 to-teal-500'
  },
  {
    id: 'review-calendar',
    label: 'Review calendar',
    phase: 'Phase 8',
    description: 'Check the agenda and upcoming reminders.',
    icon: FiCalendar,
    accent: 'from-sky-400 to-cyan-500'
  },
  {
    id: 'view-notifications',
    label: 'View notifications',
    phase: 'Phase 10',
    description: 'See your latest activity and alerts.',
    icon: FiBell,
    accent: 'from-rose-400 to-pink-500'
  }
];

const launchpadCards = [
  {
    icon: FiBookOpen,
    title: 'Blog pipeline',
    phase: 'Phase 6',
    description: 'Drafts, SEO, comments, and publishing flow land here next.'
  },
  {
    icon: FiActivity,
    title: 'Timeline feed',
    phase: 'Phase 7',
    description: 'Daily thoughts, media attachments, and pinned posts will flow here.'
  },
  {
    icon: FiCalendar,
    title: 'Calendar planner',
    phase: 'Phase 8',
    description: 'Month, week, day, and agenda views with reminders and filters.'
  },
  {
    icon: FiMessageSquare,
    title: 'Telegram-style chat',
    phase: 'Phase 9',
    description: 'Real-time messaging, voice notes, and media sharing will connect here.'
  }
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatDateTime = (date) => {
  if (!date) return 'Not set yet';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
};

const includesQuery = (query, ...values) => {
  if (!query) return true;
  return values.some((value) => String(value || '').toLowerCase().includes(query));
};

const activityIconMap = {
  spark: FiZap,
  shield: FiCheckCircle,
  login: FiActivity,
  refresh: FiClock
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const currentUser = outletContext?.currentUser || null;
  const profileSummary = outletContext?.profileSummary || null;

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboard,
    staleTime: 60 * 1000
  });

  const dashboardData = dashboardQuery.data?.data || null;
  const dashboardUser = dashboardData?.user || currentUser;
  const dashboardSummary = dashboardData?.summary || profileSummary;
  const dashboardMetrics = dashboardData?.metrics || null;
  const recentActivity = dashboardData?.recentActivity || [];

  const firstName = dashboardUser?.name?.trim()?.split(/\s+/)?.[0] || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionId, setSelectedActionId] = useState(quickActions[0].id);

  const completionPercentage = dashboardSummary?.completion?.percentage ?? 0;
  const streakCurrent = dashboardSummary?.streak?.current ?? dashboardUser?.dailyStreak ?? 0;
  const streakBest = dashboardSummary?.streak?.best ?? dashboardUser?.bestStreak ?? 0;
  const tasksCreated = dashboardSummary?.stats?.tasksCreated ?? 0;
  const tasksCompleted = dashboardSummary?.stats?.tasksCompleted ?? 0;
  const blogsPublished = dashboardSummary?.stats?.blogsPublished ?? 0;
  const notesCreated = dashboardSummary?.stats?.notesCreated ?? 0;
  const timelinePosts = dashboardSummary?.stats?.timelinePosts ?? 0;
  const messagesSent = dashboardSummary?.stats?.messagesSent ?? 0;
  const lastActiveAt = dashboardUser?.lastActiveAt || dashboardUser?.updatedAt || null;

  const query = searchTerm.trim().toLowerCase();

  const filteredTasks = useMemo(() => {
    return upcomingTasks.filter((task) => includesQuery(query, task.title, task.time, task.state, task.category, task.detail));
  }, [query]);

  const filteredActivity = useMemo(() => {
    return recentActivity.filter((item) => includesQuery(query, item.title, item.meta, item.detail));
  }, [query, recentActivity]);

  const filteredNotifications = useMemo(() => {
    return staticNotifications.filter((item) => includesQuery(query, item.title, item.meta));
  }, [query]);

  const selectedAction = quickActions.find((action) => action.id === selectedActionId) || quickActions[0];
  const SelectedActionIcon = selectedAction.icon;
  const notificationToneClasses = {
    amber: 'bg-amber-500/10 text-amber-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
    violet: 'bg-violet-500/10 text-violet-500',
    emerald: 'bg-emerald-500/10 text-emerald-500'
  };

  const workspaceMetrics = [
    {
      label: 'Profile completion',
      value: `${completionPercentage}%`,
      hint: dashboardSummary?.completion?.isComplete ? 'Ready to share' : 'Keep polishing',
      icon: FiZap,
      width: `${Math.max(completionPercentage, 8)}%`
    },
    {
      label: 'Current streak',
      value: `${streakCurrent} days`,
      hint: `Best ${streakBest} days`,
      icon: FiStar,
      width: `${Math.min(Math.max(streakCurrent * 8, 10), 100)}%`
    },
    {
      label: 'Tasks',
      value: `${tasksCreated}`,
      hint: `${tasksCompleted} completed`,
      icon: FiCheckCircle,
      width: `${Math.min(Math.max(tasksCreated * 8, 10), 100)}%`
    },
    {
      label: 'Messages sent',
      value: `${messagesSent}`,
      hint: 'Realtime ready',
      icon: FiMessageSquare,
      width: `${Math.min(Math.max(messagesSent * 3, 10), 100)}%`
    }
  ];

  const searchSummary = query
    ? `${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'}, ${filteredActivity.length} update${
        filteredActivity.length === 1 ? '' : 's'
      }, ${filteredNotifications.length} notification${filteredNotifications.length === 1 ? '' : 's'}`
    : 'Showing the full workspace';

  const momentumMetrics = [
    { label: 'Delivery', value: dashboardMetrics?.momentum?.delivery ?? Math.min(100, tasksCreated * 4 + tasksCompleted * 8 + blogsPublished * 12), icon: FiTrendingUp },
    { label: 'Publishing', value: dashboardMetrics?.momentum?.publishing ?? Math.min(100, blogsPublished * 20 + notesCreated * 8), icon: FiBarChart2 },
    { label: 'Collaboration', value: dashboardMetrics?.momentum?.collaboration ?? Math.min(100, messagesSent * 3 + timelinePosts * 6), icon: FiUsers }
  ];

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="surface-card overflow-hidden p-6 sm:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="section-label w-fit">{getGreeting()}</p>
              <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {firstName ? `Your command center is ready, ${firstName}.` : 'Your command center is ready to orchestrate the day.'}
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                This dashboard now brings together your focus, notifications, quick actions, and daily momentum while
                the rest of the product roadmap comes online.
                {dashboardUser?.title ? ` Your current role is set to ${dashboardUser.title}.` : ''}
                {dashboardSummary?.completion ? ` Profile completion sits at ${dashboardSummary.completion.percentage}%.` : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className="primary-button" onClick={() => navigate('/tasks')}>
                <FiPlus />
                New task
              </button>
              <button type="button" className="secondary-button" onClick={() => navigate('/calendar')}>
                <FiCalendar />
                Review calendar
              </button>
              <Link className="secondary-button" to="/profile">
                Open profile
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Last active</p>
                <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">{formatDateTime(lastActiveAt)}</p>
              </div>
              <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Search status</p>
                <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">{searchSummary}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Search workspace
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-slate-950 dark:text-white">
                  Filter tasks, updates, and alerts
                </h3>
              </div>
              <span className="nav-chip">
                <FiSearch />
                Live
              </span>
            </div>

            <div className="mt-5 relative">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tasks, notes, and notifications..."
                className="input-shell pl-11"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Tasks', value: filteredTasks.length, tone: 'cyan' },
                { label: 'Updates', value: filteredActivity.length, tone: 'violet' },
                { label: 'Alerts', value: filteredNotifications.length, tone: 'emerald' }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-[rgb(var(--surface-soft))] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-2 font-display text-2xl font-semibold text-slate-950 dark:text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[24px] bg-gradient-to-br from-cyan-500/10 to-sky-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Selected action</p>
              <div className="mt-3 flex items-start gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${selectedAction.accent} text-slate-950`}>
                  <SelectedActionIcon className="text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">{selectedAction.label}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedAction.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workspaceMetrics.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="surface-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white">{card.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                  <Icon />
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{ width: card.width }} />
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{card.hint}</p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="surface-card p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-label w-fit">Today&apos;s tasks</p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white">
                  What deserves attention next
                </h3>
              </div>
              <span className="nav-chip">
                <FiCalendar />
                Today
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {filteredTasks.length ? (
                filteredTasks.map((task) => (
                  <div key={task.title} className="flex items-start justify-between gap-4 rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${task.accent} text-slate-950`}>
                        <FiClock />
                      </div>
                      <div>
                        <p className="font-medium text-slate-950 dark:text-white">{task.title}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.detail}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="nav-chip">{task.category}</span>
                          <span className="nav-chip">{task.state}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{task.time}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-6 text-center">
                  <p className="font-semibold text-slate-950 dark:text-white">No matching tasks</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Try a different search term to surface another part of the workspace.
                  </p>
                </div>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6 }}
            className="surface-card p-6"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
              <FiActivity className="text-cyan-500" />
              Recent activity
            </div>

            <div className="mt-4 space-y-3">
              {filteredActivity.length ? (
                filteredActivity.map((item) => {
                  const Icon = activityIconMap[item.icon] || FiActivity;

                  return (
                    <div key={item.title} className="rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                          <Icon />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-950 dark:text-white">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.meta}</p>
                          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-6 text-center">
                  <p className="font-semibold text-slate-950 dark:text-white">No activity matches your search</p>
                </div>
              )}
            </div>
          </motion.section>
        </div>

        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="surface-card p-6"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
              <FiBell className="text-cyan-500" />
              Notifications
            </div>

            <div className="mt-4 space-y-3">
              {filteredNotifications.length ? (
                filteredNotifications.map((item) => {
                  const Icon = item.icon;
                  const dotStyles = {
                    amber: 'bg-amber-400',
                    cyan: 'bg-cyan-400',
                    violet: 'bg-violet-400',
                    emerald: 'bg-emerald-400'
                  };

                  return (
                    <div key={item.title} className="rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl ${notificationToneClasses[item.tone]}`}>
                          <Icon />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-950 dark:text-white">{item.title}</p>
                            {item.unread ? <span className={`h-2.5 w-2.5 rounded-full ${dotStyles[item.tone]}`} /> : null}
                          </div>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.meta}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-6 text-center">
                  <p className="font-semibold text-slate-950 dark:text-white">No notifications match your search</p>
                </div>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="surface-card p-6"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
              <FiStar className="text-cyan-500" />
              Quick actions
            </div>
            <div className="mt-4 grid gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const isActive = action.id === selectedActionId;

                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      if (action.id === 'draft-blog') navigate('/blog/new');
                      else if (action.id === 'new-task') navigate('/tasks');
                      else if (action.id === 'review-calendar') navigate('/calendar');
                      else if (action.id === 'open-chat') navigate('/chat');
                      else if (action.id === 'view-notifications') navigate('/notifications');
                      else if (action.id === 'write-note') navigate('/notes');
                      else setSelectedActionId(action.id);
                    }}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 ${
                      isActive
                        ? 'border-cyan-400/50 bg-cyan-500/10'
                        : 'border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))]'
                    }`}
                    aria-pressed={isActive}
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${action.accent} text-slate-950`}>
                      <Icon />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-950 dark:text-white">{action.label}</p>
                        <span className="nav-chip">{action.phase}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="surface-card p-6"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
              <FiTrendingUp className="text-cyan-500" />
              Workspace health
            </div>
            <div className="mt-4 space-y-4">
              {momentumMetrics.map((metric) => {
                const Icon = metric.icon;

                return (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Icon className="text-cyan-500" />
                        {metric.label}
                      </span>
                      <span className="font-semibold text-slate-950 dark:text-white">{metric.value}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.6 }}
        className="surface-card p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label w-fit">Module launchpad</p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white">
              The next modules are already staged.
            </h3>
          </div>
          <span className="nav-chip">
            <FiArrowUpRight />
            Roadmap preview
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {launchpadCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className={`rounded-[24px] bg-[rgb(var(--bg-elevated))] p-5 ${card.title === 'Blog pipeline' || card.title === 'Timeline feed' || card.title === 'Calendar planner' ? 'cursor-pointer transition-transform hover:-translate-y-1' : ''}`}
                onClick={() => {
                  if (card.title === 'Blog pipeline') navigate('/blog');
                  if (card.title === 'Timeline feed') navigate('/timeline');
                  if (card.title === 'Calendar planner') navigate('/calendar');
                }}
                role={card.title === 'Blog pipeline' || card.title === 'Timeline feed' || card.title === 'Calendar planner' ? 'button' : undefined}
                tabIndex={card.title === 'Blog pipeline' || card.title === 'Timeline feed' || card.title === 'Calendar planner' ? 0 : undefined}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ')) {
                    if (card.title === 'Blog pipeline') navigate('/blog');
                    if (card.title === 'Timeline feed') navigate('/timeline');
                    if (card.title === 'Calendar planner') navigate('/calendar');
                  }
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                    <Icon />
                  </div>
                  <span className="nav-chip">{card.phase}</span>
                </div>
                <h4 className="mt-4 font-display text-xl font-semibold text-slate-950 dark:text-white">{card.title}</h4>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{card.description}</p>
              </div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
};

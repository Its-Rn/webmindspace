import { useEffect, useState } from 'react';
import { Outlet, useOutletContext, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiBell, FiBookOpen, FiCalendar, FiClock, FiFileText,
  FiGrid, FiMessageSquare, FiSearch, FiSettings, FiShield,
  FiUser, FiMenu, FiX, FiZap
} from 'react-icons/fi';

import { ThemeToggle } from '../components/ThemeToggle';
import { UserMenu } from '../components/UserMenu';
import { PageTransition } from '../components/PageTransition';
import { notificationApi } from '../services/notification';
import { getSocket } from '../services/socket';
import { useToast } from '../context/ToastContext';
import { settingsService } from '../services/settings';

const navigationItems = [
  { label: 'Dashboard',      icon: FiGrid,         to: '/dashboard' },
  { label: 'Profile',        icon: FiUser,          to: '/profile' },
  { label: 'Blog',           icon: FiBookOpen,      to: '/blog' },
  { label: 'Timeline',       icon: FiClock,         to: '/timeline' },
  { label: 'Calendar',       icon: FiCalendar,      to: '/tasks' },
  { label: 'Chat',           icon: FiMessageSquare, to: '/chat' },
  { label: 'Notifications',  icon: FiBell,          to: '/notifications' },
  { label: 'Notes',          icon: FiFileText,      to: '/notes' },
  { label: 'Admin',          icon: FiShield,        to: '/admin' },
  { label: 'Settings',       icon: FiSettings,      to: '/admin/settings', adminOnly: true },
];

export const PrivateLayout = () => {
  const outletContext = useOutletContext();
  const currentUser = outletContext?.currentUser || null;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMobile = () => setIsMobileMenuOpen(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: Boolean(currentUser),
    refetchInterval: 30000
  });
  const unreadCount = unreadCountData?.data?.data?.count ?? 0;

  const { data: siteSettingsData } = useQuery({
    queryKey: ['site-settings'],
    queryFn: settingsService.getSettings,
    staleTime: 5 * 60 * 1000
  });
  const siteSettings = siteSettingsData?.data?.settings;
  const siteName = siteSettings?.siteName || 'Pulse';
  const siteLogoText = siteSettings?.siteLogoText?.charAt(0)?.toUpperCase() || 'P';
  const siteTagline = siteSettings?.siteTagline || 'Personal OS';

  useEffect(() => {
    if (!currentUser) return undefined;

    const socket = getSocket();

    const handleNewNotification = (notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.info(notification?.title || 'You have a new notification');
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [currentUser, queryClient, toast]);

  const filteredNavigationItems = navigationItems.filter(item => {
    if ((item.to === '/admin' || item.adminOnly) && currentUser?.role !== 'admin') {
      return false;
    }
    return true;
  });

  const navLinkBase =
    'group flex w-full items-center justify-between rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-cyan-500/[0.06] hover:shadow-md active:scale-[0.98]';
  const navLinkActive = '!border-cyan-400/50 !bg-cyan-500/10 !shadow-md';

  return (
    <div className="relative min-h-screen">
      {/* Subtle top ambient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[20rem] bg-gradient-to-b from-indigo-500/8 via-cyan-500/6 to-transparent blur-3xl" />

      {/* ══════════════════════════════════════
          MOBILE DRAWER
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
              className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
            />

            {/* Side Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col bg-[rgb(var(--bg-elevated))] border-r border-[rgb(var(--border))] shadow-2xl lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-sm font-bold text-slate-950 shadow-md shadow-cyan-400/20">
                    {siteLogoText}
                  </div>
                  <div className="leading-tight">
                    <p className="font-display text-sm font-semibold tracking-tight text-slate-950 dark:text-white">{siteName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{siteTagline}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeMobile}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))] text-[rgb(var(--text))] hover:border-cyan-400/30 active:scale-95"
                  aria-label="Close menu"
                >
                  <FiX />
                </button>
              </div>

              {/* Drawer Nav */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Workspace
                </p>
                <nav className="space-y-1.5">
                  {filteredNavigationItems.map((item) => {
                    const Icon = item.icon;
                    if (item.type === 'button') {
                      return (
                        <button key={item.label} type="button" className={navLinkBase} onClick={closeMobile}>
                          <span className="flex items-center gap-3">
                            <Icon className="text-base text-cyan-500 transition-transform duration-200 group-hover:scale-110" />
                            <span className="text-sm font-medium text-[rgb(var(--text))]">{item.label}</span>
                          </span>
                        </button>
                      );
                    }
                    return (
                      <NavLink
                        key={item.label}
                        to={item.to}
                        onClick={closeMobile}
                        className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : ''}`}
                      >
                        {({ isActive }) => (
                          <>
                            <span className="flex items-center gap-3">
                              <Icon className={`text-base transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-cyan-500'}`} />
                              <span className="text-sm font-medium text-[rgb(var(--text))]">{item.label}</span>
                            </span>
                            {isActive && (
                              <motion.span layoutId="activeNavMobile" className="size-1.5 rounded-full bg-cyan-400" />
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Footer — Workspace status */}
              <div className="border-t border-[rgb(var(--border))] p-4">
                <div className="rounded-2xl bg-[rgb(var(--surface-soft))] p-4 text-sm">
                  <div className="flex items-center gap-2 text-[rgb(var(--text))]">
                    <FiZap className="text-cyan-500" />
                    <p className="font-semibold">Workspace status</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                    Profile completion:{' '}
                    <span className="font-semibold text-cyan-500">
                      {outletContext?.profileSummary?.completion?.percentage ?? 0}%
                    </span>
                    {' '}· Streak:{' '}
                    <span className="font-semibold text-cyan-500">
                      {outletContext?.profileSummary?.streak?.current ?? 0} days
                    </span>
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          MAIN WRAPPER
      ══════════════════════════════════════ */}
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-3 py-4 sm:px-5 lg:px-8">

        {/* ══════════════════════════════════════
            HEADER
        ══════════════════════════════════════ */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="glass-panel px-4 py-3 sm:px-5 sm:py-3.5"
        >
          <div className="flex items-center justify-between gap-2 sm:gap-4">

            {/* Left: Hamburger + Brand */}
            <div className="flex items-center gap-2.5">
              {/* Hamburger — mobile only */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text))] hover:border-cyan-400/30 hover:shadow-sm active:scale-95 lg:hidden"
                aria-label="Open navigation"
              >
                <FiMenu />
              </button>

              {/* Brand mark */}
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-sm font-bold text-slate-950 shadow-md shadow-cyan-400/15">
                  {siteLogoText}
                </div>
                <div className="hidden leading-tight sm:block">
                  <p className="font-display text-sm font-semibold tracking-tight text-slate-950 dark:text-white">{siteName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{siteTagline}</p>
                </div>
              </div>
            </div>

            {/* Center: Desktop navigation */}
            <div className="hidden flex-1 items-center justify-center lg:flex">
              <nav className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
                {filteredNavigationItems.map((item) => {
                  const Icon = item.icon;
                  const base =
                    'flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-cyan-500/10 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-400';

                  if (item.type === 'button') {
                    return (
                      <button key={item.label} type="button" className={base}>
                        <Icon className="text-base" />
                        <span>{item.label}</span>
                      </button>
                    );
                  }
                  return (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      className={({ isActive }) =>
                        `${base} ${isActive ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-semibold' : ''}`
                      }
                    >
                      <Icon className="text-base" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex shrink-0 items-center gap-2">
              {/* Search pill — hidden on small mobile */}
              <div className="hidden items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-3 py-2 text-sm text-slate-500 transition-all duration-200 hover:border-cyan-400/30 hover:text-cyan-600 dark:text-slate-300 md:flex cursor-pointer">
                <FiSearch className="text-base" />
                <span className="hidden xl:inline">Search everything</span>
                <kbd className="ml-1 hidden rounded border border-[rgb(var(--border))] bg-[rgb(var(--surface-soft))] px-1.5 py-0.5 text-[10px] font-medium text-slate-400 xl:block">⌘K</kbd>
              </div>

              {/* Notifications */}
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text))] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:shadow-sm active:scale-95"
                aria-label="Open notifications"
              >
                <FiBell className="text-base" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <ThemeToggle />
              <UserMenu user={currentUser} />
            </div>
          </div>

          {/* Mobile greeting strip */}
          <div className="mt-2 border-t border-[rgb(var(--border))]/40 pt-2.5 lg:hidden">
            <p className="font-display text-base font-semibold tracking-tight text-slate-950 dark:text-white truncate">
              {currentUser?.name
                ? `Hey, ${currentUser.name.split(' ')[0]} 👋`
                : 'Your workspace'}
            </p>
          </div>
        </motion.header>

        {/* ══════════════════════════════════════
            PAGE CONTENT
        ══════════════════════════════════════ */}
        <main className="flex-1 min-w-0">
          <PageTransition>
            <Outlet context={outletContext} />
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

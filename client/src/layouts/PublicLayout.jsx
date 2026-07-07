import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiActivity } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';

import { ThemeToggle } from '../components/ThemeToggle';
import { UserMenu } from '../components/UserMenu';
import { PageTransition } from '../components/PageTransition';
import { userService } from '../services/user';
import { settingsService } from '../services/settings';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

export const PublicLayout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(
    location.pathname
  );

  const currentUserQuery = useQuery({
    queryKey: ['workspace-user'],
    queryFn: userService.getMyProfile,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000
  });

  const siteSettingsQuery = useQuery({
    queryKey: ['site-settings'],
    queryFn: settingsService.getSettings,
    staleTime: 5 * 60 * 1000
  });

  const isLoggedIn = !!currentUserQuery.data?.data?.user;
  const user = currentUserQuery.data?.data?.user;
  const siteSettings = siteSettingsQuery.data?.data?.settings;
  const siteName = siteSettings?.siteName || 'Pulse';
  const siteLogoText = siteSettings?.siteLogoText?.charAt(0)?.toUpperCase() || 'P';
  const siteTagline = siteSettings?.siteTagline || 'Personal OS';

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="relative min-h-screen">
      {/* Decorative top gradient */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[28rem] bg-gradient-to-b from-cyan-400/12 via-sky-500/7 to-transparent blur-3xl" />

      {/* ── Navbar ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Left: Brand */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5" onClick={closeMobile}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-sm font-bold text-slate-950 shadow-md shadow-cyan-400/20">
              {siteLogoText}
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold tracking-tight text-slate-950 dark:text-white">{siteName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{siteTagline}</p>
            </div>
          </Link>

          {/* Center: Desktop nav links (only shown if logged in) */}
          {!isAuthPage && isLoggedIn && (
            <div className="hidden items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-cyan-500/10 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* If NOT on auth page, show actions based on login status */}
            {!isAuthPage && (
              <>
                {isLoggedIn ? (
                  // Logged-in view: Dashboard CTA and User Menu
                  <div className="hidden items-center gap-3 sm:flex">
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-md shadow-cyan-400/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-400/30 active:scale-95"
                    >
                      Dashboard
                    </Link>
                    <UserMenu user={user} />
                  </div>
                ) : (
                  // Guest view: Show ONLY Log in button
                  <div className="flex items-center">
                    <Link
                      to="/login"
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-all duration-200"
                    >
                      Log in
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Auth page hint (desktop) */}
            {isAuthPage && (
              <div className="hidden items-center gap-2 text-sm text-slate-500 dark:text-slate-400 sm:flex">
                <span>New here?</span>
                <Link to="/register" className="font-semibold text-cyan-500 transition-colors hover:text-cyan-400">
                  Create account
                </Link>
              </div>
            )}

            <ThemeToggle />

            {/* Mobile hamburger — only shown when logged in and not on auth page */}
            {!isAuthPage && isLoggedIn && (
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text))] transition-all duration-200 hover:border-cyan-400/30 active:scale-95 md:hidden"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile Dropdown Menu (only if logged in) ── */}
        <AnimatePresence>
          {mobileOpen && !isAuthPage && isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden border-t border-[rgb(var(--border))] bg-[rgb(var(--bg))]/95 backdrop-blur-xl md:hidden"
            >
              <div className="mx-auto max-w-7xl space-y-1 px-4 pb-5 pt-3">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={closeMobile}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-cyan-500/10 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400"
                  >
                    {link.label}
                  </a>
                ))}

                {/* Mobile CTAs */}
                <div className="flex flex-col gap-2 pt-3">
                  <Link
                    to="/dashboard"
                    onClick={closeMobile}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-md shadow-cyan-400/20 transition-all duration-200 active:scale-95"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    onClick={closeMobile}
                    className="flex w-full items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-4 py-3 text-sm font-semibold text-[rgb(var(--text))]"
                  >
                    My Profile
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main content */}
      <main className="pt-16">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
};

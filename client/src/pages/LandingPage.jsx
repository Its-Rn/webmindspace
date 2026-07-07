import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiActivity,
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiCompass,
  FiDatabase,
  FiGlobe,
  FiGrid,
  FiLayers,
  FiMail,
  FiMessageSquare,
  FiMonitor,
  FiPhone,
  FiPlay,
  FiSend,
  FiPenTool,
  FiShield,
  FiSmartphone,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiZap
} from 'react-icons/fi';

import { publicService } from '../services/public';
import { settingsService } from '../services/settings';
import { userService } from '../services/user';

const heroStats = [
  { label: 'Modules planned', value: '12+' },
  { label: 'Theme modes', value: 'Dark / Light' },
  { label: 'Realtime ready', value: 'Yes' }
];

const featureCards = [
  {
    icon: FiLayers,
    title: 'Unified workspace',
    description: 'Tasks, notes, blog drafts, timeline posts, and chat live under one polished product shell.'
  },
  {
    icon: FiMessageSquare,
    title: 'Realtime conversations',
    description: 'Telegram-inspired messaging is ready for presence, typing, unread badges, and media sharing.'
  },
  {
    icon: FiBookOpen,
    title: 'Publishing studio',
    description: 'Drafts, rich text, markdown, SEO fields, likes, comments, and categories are all accounted for.'
  },
  {
    icon: FiCalendar,
    title: 'Calendar planning',
    description: 'Month, week, day, and agenda views support reminders, priorities, recurring tasks, and filters.'
  },
  {
    icon: FiShield,
    title: 'Secure foundation',
    description: 'JWT auth, refresh tokens, HTTP-only cookies, validation, and rate limiting are already wired.'
  },
  {
    icon: FiZap,
    title: 'Premium motion',
    description: 'Glassmorphism, gradients, rounded cards, and framer-motion polish keep the experience calm.'
  }
];

const screenshotCards = [
  {
    icon: FiMonitor,
    title: 'Dashboard snapshot',
    description: 'A daily command center with focus stats, quick actions, and priority highlights.',
    accent: 'from-cyan-400 to-sky-500',
    notes: ['Search', 'Notifications', 'Quick actions']
  },
  {
    icon: FiMessageSquare,
    title: 'Telegram-style chat',
    description: 'Private chats, groups, read receipts, and media threads with a right-side profile panel.',
    accent: 'from-violet-400 to-fuchsia-500',
    notes: ['Presence', 'Typing', 'Delivered']
  },
  {
    icon: FiBookOpen,
    title: 'Notion-like notes',
    description: 'Rich text, markdown, tables, code blocks, checklists, and pinned notes in one place.',
    accent: 'from-amber-400 to-orange-500',
    notes: ['Markdown', 'Tables', 'Pin']
  },
  {
    icon: FiCalendar,
    title: 'Calendar + planner',
    description: 'Drag-and-drop tasks, color labels, and reminders organized by day, week, or month.',
    accent: 'from-emerald-400 to-teal-500',
    notes: ['Month', 'Week', 'Agenda']
  }
];

const aboutHighlights = [
  {
    icon: FiActivity,
    label: 'Design goal',
    value: 'A calm operating system for focused personal work'
  },
  {
    icon: FiTrendingUp,
    label: 'Product vision',
    value: 'Move from scattered tools to one premium workflow'
  },
  {
    icon: FiUsers,
    label: 'Audience',
    value: 'Creators, founders, builders, and solo operators'
  }
];

const serviceCards = [
  {
    icon: FiCompass,
    title: 'Daily command center',
    description: 'Start every day with task prioritization, recent activity, and a clean overview of what matters.',
    bullets: ['Overview cards', 'Fast search', 'Keyboard shortcuts']
  },
  {
    icon: FiPenTool,
    title: 'Content studio',
    description: 'Write blog posts, publish drafts, and manage SEO fields with a structure that scales cleanly.',
    bullets: ['Markdown editor', 'Publishing flow', 'Comments and likes']
  },
  {
    icon: FiSmartphone,
    title: 'Timeline journal',
    description: 'Capture thoughts, images, videos, files, hashtags, locations, and pinned memories chronologically.',
    bullets: ['Infinite scroll', 'Media uploads', 'Filter by date']
  },
  {
    icon: FiDatabase,
    title: 'Growth analytics',
    description: 'Track activity logs, completion trends, streaks, and upcoming work with a data-first lens.',
    bullets: ['Stats', 'Reports', 'Exports']
  }
];

const testimonials = [
  {
    name: 'Aarav Shah',
    role: 'Product designer',
    quote:
      'It feels like Notion, Linear, and Telegram were merged with just enough Apple-style restraint to stay elegant.',
    accent: 'from-cyan-400 to-sky-500'
  },
  {
    name: 'Meera Iyer',
    role: 'Founder',
    quote:
      'The structure makes it obvious how the app will grow, and the landing page communicates the product story clearly.',
    accent: 'from-violet-400 to-fuchsia-500'
  },
  {
    name: 'Kabir Verma',
    role: 'Ops lead',
    quote:
      'The premium feel is there, but the layout still reads fast on mobile. That balance is what makes it strong.',
    accent: 'from-emerald-400 to-teal-500'
  }
];

const faqItems = [
  {
    question: 'What is Pulse built for?',
    answer:
      'Pulse is a personal productivity platform that combines planning, publishing, journaling, messaging, and admin tools in one product.'
  },
  {
    question: 'Is the landing page responsive?',
    answer:
      'Yes. The sections use flexible grids, compact cards, and mobile-first spacing so the page reads well on phones, tablets, and desktops.'
  },
  {
    question: 'Does the contact form actually work?',
    answer:
      'Yes. It posts to a public API route that sends email through the existing mail service, with preview logging when SMTP is not configured.'
  },
  {
    question: 'What comes after Phase 4?',
    answer:
      'Phase 5 focuses on the authenticated dashboard, followed by blog, timeline, calendar, chat, notes, and admin modules.'
  }
];

const contactInfo = [
  {
    icon: FiMail,
    label: 'Email',
    value: 'hello@pulse.app',
    href: 'mailto:hello@pulse.app'
  },
  {
    icon: FiPhone,
    label: 'Phone',
    value: '+91 98765 43210',
    href: 'tel:+919876543210'
  },
  {
    icon: FiGlobe,
    label: 'Timezone',
    value: 'Asia/Calcutta',
    href: null
  },
  {
    icon: FiClock,
    label: 'Reply time',
    value: 'Within 24 hours',
    href: null
  }
];

const defaultContactValues = {
  name: '',
  email: '',
  company: '',
  subject: 'Product demo request',
  message: ''
};

export const LandingPage = () => {
  const [activeFaqIndex, setActiveFaqIndex] = useState(0);
  const [contactNotice, setContactNotice] = useState({ tone: '', text: '' });
  
  const currentUserQuery = useQuery({
    queryKey: ['workspace-user'],
    queryFn: userService.getMyProfile,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000
  });

  const settingsQuery = useQuery({
    queryKey: ['site-settings'],
    queryFn: settingsService.getSettings,
    staleTime: 60 * 1000,
    retry: false
  });

  const settings = settingsQuery.data?.data?.settings;
  const landingPageContent = settings?.landingPageContent || {};

  const dynamicFeatures = landingPageContent.features?.length
    ? landingPageContent.features
    : featureCards;

  const dynamicTestimonials = landingPageContent.testimonials?.length
    ? landingPageContent.testimonials
    : testimonials;

  const dynamicFaqItems = landingPageContent.faqItems?.length
    ? landingPageContent.faqItems
    : faqItems;

  const dynamicServices = landingPageContent.services?.length
    ? landingPageContent.services
    : serviceCards;

  const contactEmail = settings?.contactEmail || 'hello@pulse.app';

  const dynamicContactInfo = [
    {
      icon: FiMail,
      label: 'Email',
      value: contactEmail,
      href: `mailto:${contactEmail}`
    },
    {
      icon: FiPhone,
      label: 'Phone',
      value: landingPageContent.contactPhone || '+91 98765 43210',
      href: landingPageContent.contactPhone ? `tel:${landingPageContent.contactPhone.replace(/[\s+]/g, '')}` : null
    },
    {
      icon: FiGlobe,
      label: 'Timezone',
      value: landingPageContent.contactTimezone || 'Asia/Calcutta',
      href: null
    },
    {
      icon: FiClock,
      label: 'Reply time',
      value: landingPageContent.contactReplyTime || 'Within 24 hours',
      href: null
    }
  ];

  const isLoggedIn = !!currentUserQuery.data?.data?.user;
  const currentUser = currentUserQuery.data?.data?.user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: defaultContactValues
  });

  const contactMutation = useMutation({
    mutationFn: publicService.submitContactForm,
    onSuccess: (response) => {
      setContactNotice({
        tone: 'success',
        text: response?.message || 'Thanks for reaching out. We will be in touch soon.'
      });
      reset(defaultContactValues);
    },
    onError: (error) => {
      setContactNotice({
        tone: 'error',
        text: error?.response?.data?.message || 'Unable to send the message right now. Please try again.'
      });
    }
  });

  const onContactSubmit = (formValues) => {
    setContactNotice({ tone: '', text: '' });
    contactMutation.mutate(formValues);
  };

  // ─── Guest View: Minimalist Tagline & Brand Only ───
  if (!isLoggedIn && !currentUserQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          {/* Logo Brand */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-3xl font-extrabold text-slate-950 shadow-xl shadow-cyan-500/20">
            P
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-6xl animate-pulse">
              Pulse
            </h1>
            <p className="mx-auto max-w-xl text-xl font-medium text-cyan-600 dark:text-cyan-400">
              A premium personal OS for focus and clarity.
            </p>
            <p className="mx-auto max-w-2xl text-base leading-8 text-slate-500 dark:text-slate-400">
              Bring your tasks, notes, blogs, timeline, and real-time chat into one unified workspace. Sign in to your account to get started.
            </p>
          </div>

          <div>
            <Link
              to="/login"
              className="primary-button inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold shadow-lg shadow-cyan-400/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            >
              Sign in to your workspace
              <FiArrowRight />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading state when checking session status
  if (currentUserQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 lg:space-y-12">
      <section id="hero" className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="section-shell flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="nav-chip">
                <FiZap />
                Welcome Back
              </span>
              <span className="nav-chip">
                <FiShield />
                {currentUser?.role === 'admin' ? 'Administrator' : 'Standard Member'}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                Hey, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Operator'}!
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                Your Pulse Personal OS account is fully active. Below are your unique workspace access rights and features:
              </p>
            </div>

            {/* Role & Rights Summary Block */}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-5 shadow-sm space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Workspace Permissions
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {currentUser?.role === 'admin' ? (
                  <>
                    <div className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5 text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Manage all user accounts & roles</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5 text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Access platform telemetry & stats</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5 text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Activate or deactivate user sessions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5 text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Full read/write on all application modules</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5 text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Create & schedule tasks on calendar</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5 text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Write blog posts & manage drafts</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5 text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Chat in real-time with unread alerts</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FiCheckCircle className="mt-0.5 text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-300">Organize and search personal rich notes</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="primary-button" to="/dashboard">
                Go to Dashboard
                <FiArrowRight />
              </Link>
              {currentUser?.role === 'admin' && (
                <Link className="secondary-button" to="/admin">
                  <FiShield />
                  Admin Panel
                </Link>
              )}
              <Link className="secondary-button" to="/profile">
                My Profile
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => (
                <div key={item.label} className="surface-card p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Inspired by</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Telegram, Notion, Discord, Linear, Apple, and Material Design.
                </p>
              </div>
              <div className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Built for</p>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Desktop, tablet, and mobile with dark mode and light mode polished into the same experience.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="surface-card relative overflow-hidden p-6 sm:p-8"
        >
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-400/20 to-transparent blur-3xl" />
          <div className="relative space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Live preview
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950 dark:text-white">
                  {landingPageContent.heroTitle || 'A calm control panel for busy days'}
                </h2>
              </div>
              <span className="nav-chip">
                <FiActivity />
                Active
              </span>
            </div>

            <div className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-3">
                  <div className="rounded-2xl bg-gradient-to-br from-cyan-400/15 to-sky-500/10 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">Today’s focus</p>
                      <FiBarChart2 className="text-cyan-500" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {['Publish the landing page', 'Reply to new contact leads', 'Review dashboard mockups'].map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl bg-[rgb(var(--bg-elevated))] p-3">
                          <FiCheckCircle className="text-emerald-500" />
                          <p className="text-sm text-slate-600 dark:text-slate-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">Focus streak</p>
                      <FiAward className="text-amber-500" />
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <p className="font-display text-3xl font-semibold text-slate-950 dark:text-white">12</p>
                      <p className="pb-1 text-sm text-slate-500 dark:text-slate-400">days in a row</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">Quick chat</p>
                      <FiPlay className="text-cyan-500" />
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="ml-auto max-w-[85%] rounded-2xl bg-cyan-500/10 p-3 text-sm text-slate-700 dark:text-slate-200">
                        Can we launch the site this week?
                      </div>
                      <div className="max-w-[85%] rounded-2xl bg-slate-200/80 p-3 text-sm text-slate-700 dark:bg-slate-700/80 dark:text-slate-200">
                        Yes — the landing page, contact flow, and public routes are ready.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Product health</p>
                    <div className="mt-4 space-y-3">
                      {[
                        { label: 'Performance', width: '90%' },
                        { label: 'Clarity', width: '82%' },
                        { label: 'Momentum', width: '95%' }
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                            <span className="font-semibold text-slate-950 dark:text-white">{item.width}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500"
                              style={{ width: item.width }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="about" className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="surface-card p-6 sm:p-8"
        >
          <p className="section-label w-fit">About</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {landingPageContent.aboutTitle || 'Built to turn scattered work into one calm rhythm.'}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {landingPageContent.aboutDescription || 'Pulse is a premium personal productivity platform designed for people who want one place to plan, write, chat, track progress, and revisit what matters. The design leans on the clarity of Linear, the flexibility of Notion, the speed of Telegram, and the polish of Apple and Material Design.'}
          </p>

          <ul className="mt-6 space-y-3">
            {[
              'Responsive layouts for desktop, tablet, and mobile',
              'Dark mode and light mode with smooth transitions',
              'Reusable architecture that can grow into every upcoming module'
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                <FiCheckCircle className="mt-0.5 text-emerald-500" />
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {aboutHighlights.map((item, index) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className={`surface-card p-5 ${index === 2 ? 'sm:col-span-2' : ''}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                  <Icon className="text-xl" />
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.value}</p>
              </div>
            );
          })}
        </motion.div>
      </section>

      <section id="features" className="space-y-6">
        <div className="flex flex-col gap-3">
          <p className="section-label w-fit">Features</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {landingPageContent.featuresTitle || 'Every major module starts with a premium foundation.'}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dynamicFeatures.map((card, index) => {
            const Icon = card.icon || FiLayers;

            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="surface-card p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                  <Icon className="text-xl" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-slate-950 dark:text-white">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{card.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section id="screenshots" className="space-y-6">
        <div className="flex flex-col gap-3">
          <p className="section-label w-fit">Screenshots</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Designed like a product preview, not a flat brochure.
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {screenshotCards.map((card) => {
            const Icon = card.icon;

            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5 }}
                className="surface-card overflow-hidden p-5"
              >
                <div className={`rounded-[28px] bg-gradient-to-br ${card.accent} p-[1px]`}>
                  <div className="rounded-[27px] bg-[rgb(var(--bg-elevated))] p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-slate-950`}>
                          <Icon className="text-xl" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">{card.title}</p>
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                            Live preview
                          </p>
                        </div>
                      </div>
                      <span className="nav-chip">
                        <FiPlay />
                        01
                      </span>
                    </div>

                    <div className="mt-5 rounded-[24px] bg-[rgb(var(--surface-soft))] p-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {card.notes.map((note) => (
                          <div key={note} className="rounded-2xl bg-[rgb(var(--bg-elevated))] p-3 text-sm text-slate-600 dark:text-slate-300">
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{card.description}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section id="services" className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="surface-card p-6 sm:p-8"
        >
          <p className="section-label w-fit">Services</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {landingPageContent.servicesTitle || 'Built to support the way modern solo teams actually work.'}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {landingPageContent.servicesDescription || 'Each module is designed to feel self-contained, but the system connects them through shared identity, search, notifications, and a clean data model.'}
          </p>
          <div className="mt-6 rounded-[28px] bg-gradient-to-br from-cyan-500/10 via-sky-500/10 to-transparent p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Outcome</p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              A single premium workspace reduces context switching and makes daily momentum easier to sustain.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="grid gap-4 md:grid-cols-2"
        >
          {dynamicServices.map((card, index) => {
            const Icon = card.icon || FiCompass;
            const bullets = card.bullets || [];

            return (
              <div key={card.title} className={`surface-card p-5 ${index === 3 || dynamicServices.length <= 2 ? 'md:col-span-2' : ''}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                  <Icon className="text-xl" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-slate-950 dark:text-white">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{card.description}</p>
                {bullets.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                  {bullets.map((bullet) => (
                    <span key={bullet} className="nav-chip">
                      <FiCheckCircle />
                      {bullet}
                    </span>
                  ))}
                </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </section>

      <section id="testimonials" className="space-y-6">
        <div className="flex flex-col gap-3">
          <p className="section-label w-fit">Testimonials</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {landingPageContent.testimonialsTitle || 'Built to feel premium from the first scroll.'}
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {dynamicTestimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="surface-card p-6"
            >
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${testimonial.accent || 'from-cyan-400 to-sky-500'}`} />
              <div className="mt-5 flex items-center gap-2 text-amber-400">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <FiStar key={`${testimonial.name}-${starIndex}`} />
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">“{testimonial.quote}”</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 font-semibold text-cyan-500">
                  {testimonial.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="faq" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="surface-card p-6 sm:p-8"
        >
          <p className="section-label w-fit">FAQ</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {landingPageContent.faqTitle || 'Quick answers for curious visitors.'}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            These are the most common questions we expect during the landing page and product review flow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="space-y-3"
        >
          {dynamicFaqItems.map((item, index) => {
            const isOpen = activeFaqIndex === index;

            return (
              <div key={item.question} className="surface-card overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setActiveFaqIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-slate-950 dark:text-white">{item.question}</span>
                  <FiChevronDown className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen ? (
                  <div className="border-t border-[rgb(var(--border))] px-5 py-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {item.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </motion.div>
      </section>

      <section id="contact" className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          className="surface-card p-6 sm:p-8"
        >
          <p className="section-label w-fit">Contact form</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {landingPageContent.contactTitle || 'Tell us what you want to build next.'}
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {landingPageContent.contactDescription || 'Drop a note and we\'ll route it through the public API contact flow. If SMTP is not set up yet, the server safely logs a preview while keeping the UX polished.'}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onContactSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Name</span>
                <input
                  className="input-shell"
                  placeholder="Your name"
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                />
                {errors.name ? <span className="text-sm text-rose-500">{errors.name.message}</span> : null}
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</span>
                <input
                  type="email"
                  className="input-shell"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email is required'
                  })}
                />
                {errors.email ? <span className="text-sm text-rose-500">{errors.email.message}</span> : null}
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Company</span>
                <input className="input-shell" placeholder="Company name" {...register('company')} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Subject</span>
                <input
                  className="input-shell"
                  placeholder="Product demo request"
                  {...register('subject', {
                    required: 'Subject is required',
                    minLength: { value: 3, message: 'Subject must be at least 3 characters' }
                  })}
                />
                {errors.subject ? <span className="text-sm text-rose-500">{errors.subject.message}</span> : null}
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Message</span>
              <textarea
                className="input-shell min-h-[160px] resize-y"
                placeholder="Tell us what you need..."
                {...register('message', {
                  required: 'Message is required',
                  minLength: { value: 20, message: 'Message should be at least 20 characters' }
                })}
              />
              {errors.message ? <span className="text-sm text-rose-500">{errors.message.message}</span> : null}
            </label>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="primary-button" disabled={contactMutation.isPending}>
                <FiSend />
                {contactMutation.isPending ? 'Sending...' : 'Send message'}
              </button>
              <a className="secondary-button" href={`mailto:${settings?.contactEmail || 'hello@pulse.app'}`}>
                <FiMail />
                Prefer email?
              </a>
            </div>

            {contactNotice.text ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  contactNotice.tone === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                }`}
              >
                {contactNotice.text}
              </div>
            ) : null}
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="space-y-4"
        >
          <div className="surface-card p-6 sm:p-8">
            <p className="section-label w-fit">Contact details</p>
            <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Fast, friendly, and structured.
            </h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {dynamicContactInfo.map((item) => {
                const Icon = item.icon;
                const content = (
                  <div className="surface-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                        <Icon />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-1 font-semibold text-slate-950 dark:text-white">{item.value}</p>
                      </div>
                    </div>
                  </div>
                );

                return item.href ? (
                  <a key={item.label} href={item.href} className="block">
                    {content}
                  </a>
                ) : (
                  <div key={item.label}>{content}</div>
                );
              })}
            </div>
          </div>

          <div className="surface-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <FiGrid className="text-cyan-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Next steps</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">What happens after you reach out</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                'We review your message and respond within one business day.',
                'We can tailor the roadmap or design language before the next phase.',
                'If you want, we can prioritize a feature module for the next iteration.'
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                  <FiCheckCircle className="mt-0.5 text-emerald-500" />
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="surface-card flex flex-col gap-5 px-6 py-6 sm:px-8 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="font-display text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{settings?.siteName || 'Pulse'}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {landingPageContent.footerDescription || 'A premium personal productivity platform built phase by phase.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <a className="nav-chip" href="#features">
            Features
          </a>
          <a className="nav-chip" href="#services">
            Services
          </a>
          <a className="nav-chip" href="#contact">
            Contact
          </a>
          <Link className="nav-chip" to="/login">
            Login
          </Link>
          <Link className="nav-chip" to="/register">
            Register
          </Link>
        </div>
      </footer>
    </div>
  );
};

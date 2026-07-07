import SiteSettings from '../models/SiteSettings.js';

export const ensureSiteSettings = async () => {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({
      siteName: 'Pulse',
      siteLogoText: 'P',
      siteTagline: 'Personal OS',
      contactEmail: 'admin@example.com',
      customFooterText: '© 2026 Pulse. All rights reserved.',
      allowRegistration: true,
      landingPageContent: {
        heroTitle: 'A calm control panel for busy days',
        heroSubtitle: '',
        heroDescription: '',
        aboutTitle: 'Built to turn scattered work into one calm rhythm.',
        aboutDescription: 'Pulse is a premium personal productivity platform designed for people who want one place to plan, write, chat, track progress, and revisit what matters. The design leans on the clarity of Linear, the flexibility of Notion, the speed of Telegram, and the polish of Apple and Material Design.',
        featuresTitle: 'Every major module starts with a premium foundation.',
        features: [
          { title: 'Unified workspace', description: 'Tasks, notes, blog drafts, timeline posts, and chat live under one polished product shell.' },
          { title: 'Realtime conversations', description: 'Telegram-inspired messaging is ready for presence, typing, unread badges, and media sharing.' },
          { title: 'Publishing studio', description: 'Drafts, rich text, markdown, SEO fields, likes, comments, and categories are all accounted for.' },
          { title: 'Calendar planning', description: 'Month, week, day, and agenda views support reminders, priorities, recurring tasks, and filters.' },
          { title: 'Secure foundation', description: 'JWT auth, refresh tokens, HTTP-only cookies, validation, and rate limiting are already wired.' },
          { title: 'Premium motion', description: 'Glassmorphism, gradients, rounded cards, and framer-motion polish keep the experience calm.' }
        ],
        testimonialsTitle: 'Built to feel premium from the first scroll.',
        testimonials: [
          { name: 'Aarav Shah', role: 'Product designer', quote: 'It feels like Notion, Linear, and Telegram were merged with just enough Apple-style restraint to stay elegant.', accent: 'from-cyan-400 to-sky-500' },
          { name: 'Meera Iyer', role: 'Founder', quote: 'The structure makes it obvious how the app will grow, and the landing page communicates the product story clearly.', accent: 'from-violet-400 to-fuchsia-500' },
          { name: 'Kabir Verma', role: 'Ops lead', quote: 'The premium feel is there, but the layout still reads fast on mobile. That balance is what makes it strong.', accent: 'from-emerald-400 to-teal-500' }
        ],
        faqTitle: 'Quick answers for curious visitors.',
        faqItems: [
          { question: 'What is Pulse built for?', answer: 'Pulse is a personal productivity platform that combines planning, publishing, journaling, messaging, and admin tools in one product.' },
          { question: 'Is the landing page responsive?', answer: 'Yes. The sections use flexible grids, compact cards, and mobile-first spacing so the page reads well on phones, tablets, and desktops.' },
          { question: 'Does the contact form actually work?', answer: 'Yes. It posts to a public API route that sends email through the existing mail service, with preview logging when SMTP is not configured.' },
          { question: 'What comes after Phase 4?', answer: 'Phase 5 focuses on the authenticated dashboard, followed by blog, timeline, calendar, chat, notes, and admin modules.' }
        ],
        servicesTitle: 'Built to support the way modern solo teams actually work.',
        servicesDescription: 'Each module is designed to feel self-contained, but the system connects them through shared identity, search, notifications, and a clean data model.',
        services: [
          { title: 'Daily command center', description: 'Start every day with task prioritization, recent activity, and a clean overview of what matters.', bullets: ['Overview cards', 'Fast search', 'Keyboard shortcuts'] },
          { title: 'Content studio', description: 'Write blog posts, publish drafts, and manage SEO fields with a structure that scales cleanly.', bullets: ['Markdown editor', 'Publishing flow', 'Comments and likes'] },
          { title: 'Timeline journal', description: 'Capture thoughts, images, videos, files, hashtags, locations, and pinned memories chronologically.', bullets: ['Infinite scroll', 'Media uploads', 'Filter by date'] },
          { title: 'Growth analytics', description: 'Track activity logs, completion trends, streaks, and upcoming work with a data-first lens.', bullets: ['Stats', 'Reports', 'Exports'] }
        ],
        contactTitle: 'Tell us what you want to build next.',
        contactDescription: 'Drop a note and we\'ll route it through the public API contact flow. If SMTP is not set up yet, the server safely logs a preview while keeping the UX polished.',
        contactPhone: '+91 98765 43210',
        contactTimezone: 'Asia/Calcutta',
        contactReplyTime: 'Within 24 hours',
        footerDescription: 'A premium personal productivity platform built phase by phase.'
      }
    });
    console.log('✅ Default site settings initialized in database.');
  }
  return settings;
};

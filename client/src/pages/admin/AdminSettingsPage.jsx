import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiEdit3,
  FiGlobe,
  FiLayers,
  FiLock,
  FiMail,
  FiSave,
  FiSettings,
  FiType,
  FiUnlock,
  FiZap
} from 'react-icons/fi';

import { settingsService } from '../../services/settings';
import { useToast } from '../../context/ToastContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }
});

const FormField = ({ label, description, icon: Icon, children }) => (
  <div className="grid gap-3 sm:grid-cols-[220px_1fr] sm:items-start">
    <div className="flex items-start gap-3 pt-1">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-950 dark:text-white">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
    </div>
    <div>{children}</div>
  </div>
);

const defaultForm = {
  siteName: '',
  siteLogoText: '',
  siteTagline: '',
  contactEmail: '',
  customFooterText: '',
  allowRegistration: true,
  landingPageContent: {
    heroTitle: '',
    heroSubtitle: '',
    heroDescription: '',
    aboutTitle: '',
    aboutDescription: '',
    featuresTitle: '',
    features: '[]',
    testimonialsTitle: '',
    testimonials: '[]',
    faqTitle: '',
    faqItems: '[]',
    servicesTitle: '',
    servicesDescription: '',
    services: '[]',
    contactTitle: '',
    contactDescription: '',
    contactPhone: '',
    contactTimezone: '',
    contactReplyTime: '',
    footerDescription: ''
  }
};

const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [dirty, setDirty] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ['site-settings'],
    queryFn: settingsService.getSettings,
    staleTime: 30 * 1000
  });

  const settings = settingsQuery.data?.data?.settings;

  useEffect(() => {
    if (settings) {
      const lpc = settings.landingPageContent || {};
      setForm({
        siteName: settings.siteName || '',
        siteLogoText: settings.siteLogoText || '',
        siteTagline: settings.siteTagline || '',
        contactEmail: settings.contactEmail || '',
        customFooterText: settings.customFooterText || '',
        allowRegistration: settings.allowRegistration ?? true,
        landingPageContent: {
          heroTitle: lpc.heroTitle || '',
          heroSubtitle: lpc.heroSubtitle || '',
          heroDescription: lpc.heroDescription || '',
          aboutTitle: lpc.aboutTitle || '',
          aboutDescription: lpc.aboutDescription || '',
          featuresTitle: lpc.featuresTitle || '',
          features: JSON.stringify(lpc.features || [], null, 2),
          testimonialsTitle: lpc.testimonialsTitle || '',
          testimonials: JSON.stringify(lpc.testimonials || [], null, 2),
          faqTitle: lpc.faqTitle || '',
          faqItems: JSON.stringify(lpc.faqItems || [], null, 2),
          servicesTitle: lpc.servicesTitle || '',
          servicesDescription: lpc.servicesDescription || '',
          services: JSON.stringify(lpc.services || [], null, 2),
          contactTitle: lpc.contactTitle || '',
          contactDescription: lpc.contactDescription || '',
          contactPhone: lpc.contactPhone || '',
          contactTimezone: lpc.contactTimezone || '',
          contactReplyTime: lpc.contactReplyTime || '',
          footerDescription: lpc.footerDescription || ''
        }
      });
      setDirty(false);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: async (res) => {
      const msg = res?.message || 'Site settings updated successfully.';
      toast.success(msg);
      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      setDirty(false);
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error.message || 'Failed to update settings.';
      toast.error(msg);
    }
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleLpcChange = (field, value) => {
    setForm((prev) => ({ ...prev, landingPageContent: { ...prev.landingPageContent, [field]: value } }));
    setDirty(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.siteName.trim()) {
      toast.warning('Site name is required.');
      return;
    }
    if (!form.siteLogoText.trim()) {
      toast.warning('Logo text is required.');
      return;
    }
    const payload = { ...form };
    const lpc = { ...payload.landingPageContent };
    for (const key of ['features', 'testimonials', 'faqItems', 'services']) {
      try {
        lpc[key] = JSON.parse(lpc[key]);
      } catch {
        toast.warning(`Invalid JSON in landing page "${key}".`);
        return;
      }
    }
    payload.landingPageContent = lpc;
    updateMutation.mutate(payload);
  };

  const handleReset = () => {
    if (settings) {
      const lpc = settings.landingPageContent || {};
      setForm({
        siteName: settings.siteName || '',
        siteLogoText: settings.siteLogoText || '',
        siteTagline: settings.siteTagline || '',
        contactEmail: settings.contactEmail || '',
        customFooterText: settings.customFooterText || '',
        allowRegistration: settings.allowRegistration ?? true,
        landingPageContent: {
          heroTitle: lpc.heroTitle || '',
          heroSubtitle: lpc.heroSubtitle || '',
          heroDescription: lpc.heroDescription || '',
          aboutTitle: lpc.aboutTitle || '',
          aboutDescription: lpc.aboutDescription || '',
          featuresTitle: lpc.featuresTitle || '',
          features: JSON.stringify(lpc.features || [], null, 2),
          testimonialsTitle: lpc.testimonialsTitle || '',
          testimonials: JSON.stringify(lpc.testimonials || [], null, 2),
          faqTitle: lpc.faqTitle || '',
          faqItems: JSON.stringify(lpc.faqItems || [], null, 2),
          servicesTitle: lpc.servicesTitle || '',
          servicesDescription: lpc.servicesDescription || '',
          services: JSON.stringify(lpc.services || [], null, 2),
          contactTitle: lpc.contactTitle || '',
          contactDescription: lpc.contactDescription || '',
          contactPhone: lpc.contactPhone || '',
          contactTimezone: lpc.contactTimezone || '',
          contactReplyTime: lpc.contactReplyTime || '',
          footerDescription: lpc.footerDescription || ''
        }
      });
      setDirty(false);
    }
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div className="surface-card flex flex-col items-center gap-4 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
          <FiAlertCircle className="text-2xl" />
        </div>
        <p className="font-display text-xl font-semibold text-slate-950 dark:text-white">Failed to load settings</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Check your connection and try refreshing.</p>
      </div>
    );
  }

  const logoPreviewLetter = form.siteLogoText?.charAt(0)?.toUpperCase() || 'P';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="surface-card overflow-hidden p-6 sm:p-8">
        <button
          type="button"
          className="nav-chip mb-5"
          onClick={() => navigate('/admin')}
        >
          <FiArrowLeft />
          Back to Admin
        </button>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
              <FiSettings className="text-xl" />
            </div>
            <div>
              <p className="section-label mb-1">Admin Panel</p>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                Site Settings
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Customize your website's identity, branding, and registration settings.
              </p>
            </div>
          </div>

          {/* Live Preview */}
          <div className="shrink-0 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Live Preview</p>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-sm font-bold text-slate-950 shadow-md">
                {logoPreviewLetter}
              </div>
              <div className="leading-tight">
                <p className="font-display text-sm font-semibold tracking-tight text-slate-950 dark:text-white">
                  {form.siteName || 'Pulse'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {form.siteTagline || 'Personal OS'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSave}>
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

          {/* Left: Brand Settings */}
          <motion.div {...fadeUp(0.06)} className="space-y-6">
            <div className="surface-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                  <FiGlobe />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Identity</p>
                  <h2 className="font-display text-lg font-semibold text-slate-950 dark:text-white">Brand Settings</h2>
                </div>
              </div>

              <div className="space-y-6">
                <FormField label="Site Name" description="The display name shown in the header and browser tab." icon={FiType}>
                  <input
                    id="siteName"
                    className="input-shell"
                    placeholder="e.g. Pulse"
                    value={form.siteName}
                    onChange={(e) => handleChange('siteName', e.target.value)}
                    maxLength={100}
                  />
                </FormField>

                <div className="border-t border-[rgb(var(--border))]" />

                <FormField label="Logo Text" description="Single character or short text used in the logo mark." icon={FiType}>
                  <div className="flex items-center gap-3">
                    <input
                      id="siteLogoText"
                      className="input-shell w-24 text-center text-lg font-bold uppercase"
                      placeholder="P"
                      value={form.siteLogoText}
                      onChange={(e) => handleChange('siteLogoText', e.target.value.slice(0, 10))}
                      maxLength={10}
                    />
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-sm font-bold text-slate-950 shadow-md">
                      {logoPreviewLetter}
                    </div>
                  </div>
                </FormField>

                <div className="border-t border-[rgb(var(--border))]" />

                <FormField label="Tagline" description="Short subtitle shown below the site name in navigation." icon={FiType}>
                  <input
                    id="siteTagline"
                    className="input-shell"
                    placeholder="e.g. Personal OS"
                    value={form.siteTagline}
                    onChange={(e) => handleChange('siteTagline', e.target.value)}
                    maxLength={200}
                  />
                </FormField>
              </div>
            </div>

            <div className="surface-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                  <FiMail />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Contact</p>
                  <h2 className="font-display text-lg font-semibold text-slate-950 dark:text-white">Content & Contact</h2>
                </div>
              </div>

              <div className="space-y-6">
                <FormField label="Contact Email" description="Default email shown on the contact page and footer." icon={FiMail}>
                  <input
                    id="contactEmail"
                    type="email"
                    className="input-shell"
                    placeholder="admin@example.com"
                    value={form.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                  />
                </FormField>

                <div className="border-t border-[rgb(var(--border))]" />

                <FormField label="Footer Text" description="Copyright or disclaimer text shown at the bottom of the site." icon={FiType}>
                  <textarea
                    id="customFooterText"
                    className="input-shell min-h-[80px] resize-y"
                    placeholder="© 2026 Pulse. All rights reserved."
                    value={form.customFooterText}
                    onChange={(e) => handleChange('customFooterText', e.target.value)}
                    maxLength={500}
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {form.customFooterText.length} / 500
                  </p>
                </FormField>
              </div>
            </div>
          </motion.div>

            {/* Landing Page Content */}
            <motion.div {...fadeUp(0.08)} className="surface-card p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                  <FiEdit3 />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Content</p>
                  <h2 className="font-display text-lg font-semibold text-slate-950 dark:text-white">Landing Page Content</h2>
                </div>
              </div>

              <div className="space-y-6">
                <FormField label="Hero Title" icon={FiType}>
                  <input className="input-shell" placeholder="Hero heading" value={form.landingPageContent.heroTitle} onChange={(e) => handleLpcChange('heroTitle', e.target.value)} maxLength={200} />
                </FormField>
                <FormField label="Hero Subtitle" icon={FiType}>
                  <input className="input-shell" placeholder="Hero subtitle" value={form.landingPageContent.heroSubtitle} onChange={(e) => handleLpcChange('heroSubtitle', e.target.value)} maxLength={200} />
                </FormField>
                <FormField label="Hero Description" icon={FiType}>
                  <textarea className="input-shell min-h-[80px] resize-y" placeholder="Hero description" value={form.landingPageContent.heroDescription} onChange={(e) => handleLpcChange('heroDescription', e.target.value)} maxLength={500} />
                </FormField>

                <div className="border-t border-[rgb(var(--border))]" />

                <FormField label="About Title" icon={FiType}>
                  <input className="input-shell" placeholder="About section heading" value={form.landingPageContent.aboutTitle} onChange={(e) => handleLpcChange('aboutTitle', e.target.value)} maxLength={200} />
                </FormField>
                <FormField label="About Description" icon={FiType}>
                  <textarea className="input-shell min-h-[80px] resize-y" placeholder="About section body text" value={form.landingPageContent.aboutDescription} onChange={(e) => handleLpcChange('aboutDescription', e.target.value)} maxLength={1000} />
                </FormField>

                <div className="border-t border-[rgb(var(--border))]" />

                <FormField label="Features Title" icon={FiType}>
                  <input className="input-shell" placeholder="Features section heading" value={form.landingPageContent.featuresTitle} onChange={(e) => handleLpcChange('featuresTitle', e.target.value)} maxLength={200} />
                </FormField>
                <FormField label="Features (JSON array)" description="Array of { title, description } objects." icon={FiLayers}>
                  <textarea className="input-shell min-h-[180px] resize-y font-mono text-xs" placeholder='[{ "title": "...", "description": "..." }]' value={form.landingPageContent.features} onChange={(e) => handleLpcChange('features', e.target.value)} />
                </FormField>

                <div className="border-t border-[rgb(var(--border))]" />

                <FormField label="Testimonials Title" icon={FiType}>
                  <input className="input-shell" placeholder="Testimonials section heading" value={form.landingPageContent.testimonialsTitle} onChange={(e) => handleLpcChange('testimonialsTitle', e.target.value)} maxLength={200} />
                </FormField>
                <FormField label="Testimonials (JSON array)" description="Array of { name, role, quote } objects." icon={FiType}>
                  <textarea className="input-shell min-h-[180px] resize-y font-mono text-xs" placeholder='[{ "name": "...", "role": "...", "quote": "..." }]' value={form.landingPageContent.testimonials} onChange={(e) => handleLpcChange('testimonials', e.target.value)} />
                </FormField>

                <div className="border-t border-[rgb(var(--border))]" />

                <FormField label="FAQ Title" icon={FiType}>
                  <input className="input-shell" placeholder="FAQ section heading" value={form.landingPageContent.faqTitle} onChange={(e) => handleLpcChange('faqTitle', e.target.value)} maxLength={200} />
                </FormField>
                <FormField label="FAQ Items (JSON array)" description="Array of { question, answer } objects." icon={FiType}>
                  <textarea className="input-shell min-h-[180px] resize-y font-mono text-xs" placeholder='[{ "question": "...", "answer": "..." }]' value={form.landingPageContent.faqItems} onChange={(e) => handleLpcChange('faqItems', e.target.value)} />
                </FormField>

                <div className="border-t border-[rgb(var(--border))]" />

                <FormField label="Services Title" icon={FiType}>
                  <input className="input-shell" placeholder="Services section heading" value={form.landingPageContent.servicesTitle} onChange={(e) => handleLpcChange('servicesTitle', e.target.value)} maxLength={200} />
                </FormField>
                <FormField label="Services Description" icon={FiType}>
                  <textarea className="input-shell min-h-[80px] resize-y" placeholder="Services section description" value={form.landingPageContent.servicesDescription} onChange={(e) => handleLpcChange('servicesDescription', e.target.value)} maxLength={1000} />
                </FormField>
                <FormField label="Services (JSON array)" description="Array of { title, description, bullets: [string] } objects." icon={FiType}>
                  <textarea className="input-shell min-h-[180px] resize-y font-mono text-xs" placeholder='[{ "title": "...", "description": "...", "bullets": ["..."] }]' value={form.landingPageContent.services} onChange={(e) => handleLpcChange('services', e.target.value)} />
                </FormField>

                <div className="border-t border-[rgb(var(--border))]" />

                <FormField label="Contact Title" icon={FiType}>
                  <input className="input-shell" placeholder="Contact section heading" value={form.landingPageContent.contactTitle} onChange={(e) => handleLpcChange('contactTitle', e.target.value)} maxLength={200} />
                </FormField>
                <FormField label="Contact Description" icon={FiType}>
                  <textarea className="input-shell min-h-[80px] resize-y" placeholder="Contact section description" value={form.landingPageContent.contactDescription} onChange={(e) => handleLpcChange('contactDescription', e.target.value)} maxLength={500} />
                </FormField>
                <FormField label="Contact Phone" icon={FiType}>
                  <input className="input-shell" placeholder="Phone number" value={form.landingPageContent.contactPhone} onChange={(e) => handleLpcChange('contactPhone', e.target.value)} maxLength={50} />
                </FormField>
                <FormField label="Timezone" icon={FiType}>
                  <input className="input-shell" placeholder="e.g. Asia/Calcutta" value={form.landingPageContent.contactTimezone} onChange={(e) => handleLpcChange('contactTimezone', e.target.value)} maxLength={50} />
                </FormField>
                <FormField label="Reply Time" icon={FiType}>
                  <input className="input-shell" placeholder="e.g. Within 24 hours" value={form.landingPageContent.contactReplyTime} onChange={(e) => handleLpcChange('contactReplyTime', e.target.value)} maxLength={50} />
                </FormField>

                <div className="border-t border-[rgb(var(--border))]" />

                <FormField label="Footer Description" icon={FiType}>
                  <textarea className="input-shell min-h-[80px] resize-y" placeholder="Footer description" value={form.landingPageContent.footerDescription} onChange={(e) => handleLpcChange('footerDescription', e.target.value)} maxLength={500} />
                </FormField>
              </div>
            </motion.div>

          {/* Right sidebar */}
          <motion.div {...fadeUp(0.10)} className="space-y-6">
            {/* Registration toggle */}
            <div className="surface-card p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${form.allowRegistration ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {form.allowRegistration ? <FiUnlock /> : <FiLock />}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Access</p>
                  <h2 className="font-display text-lg font-semibold text-slate-950 dark:text-white">Registration</h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleChange('allowRegistration', !form.allowRegistration)}
                className={`group relative flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                  form.allowRegistration
                    ? 'border-emerald-400/40 bg-emerald-500/5 hover:bg-emerald-500/10'
                    : 'border-rose-400/40 bg-rose-500/5 hover:bg-rose-500/10'
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {form.allowRegistration ? 'Registration Open' : 'Registration Closed'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {form.allowRegistration
                      ? 'New users can create accounts freely.'
                      : 'Sign-ups are disabled. Invite-only mode.'}
                  </p>
                </div>
                <div
                  className={`relative h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                    form.allowRegistration ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      form.allowRegistration ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>

              {!form.allowRegistration && (
                <div className="mt-3 rounded-xl bg-rose-500/5 border border-rose-400/20 p-3">
                  <p className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                    <FiAlertCircle className="shrink-0" />
                    Public registration is disabled. Only admins can create accounts.
                  </p>
                </div>
              )}
            </div>

            {/* Status + Save actions */}
            <div className="surface-card p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <FiSave />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Actions</p>
                  <h2 className="font-display text-lg font-semibold text-slate-950 dark:text-white">Save Changes</h2>
                </div>
              </div>

              {updateMutation.isSuccess && !dirty && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-3">
                  <FiCheckCircle className="shrink-0 text-emerald-500" />
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Settings saved successfully.</p>
                </div>
              )}

              {dirty && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-400/20 p-3">
                  <FiZap className="shrink-0 text-amber-500" />
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">You have unsaved changes.</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={updateMutation.isPending || !dirty}
                  className="primary-button w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <FiSave />
                      Save Settings
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={!dirty || updateMutation.isPending}
                  onClick={handleReset}
                  className="secondary-button w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reset to Saved
                </button>
              </div>
            </div>

            {/* Metadata */}
            {settings?.updatedAt && (
              <div className="surface-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Last Updated</p>
                <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">
                  {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(settings.updatedAt))}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;

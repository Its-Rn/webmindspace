import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  FiActivity,
  FiArrowLeft,
  FiBarChart2,
  FiClock,
  FiImage,
  FiLock,
  FiSave,
  FiZap,
  FiStar,
  FiUpload
} from 'react-icons/fi';
import { Link, useOutletContext } from 'react-router-dom';

import { UserAvatar } from '../components/UserAvatar';
import { authService } from '../services/auth';
import { userService } from '../services/user';

const defaultProfileValues = {
  name: '',
  title: '',
  bio: '',
  location: '',
  website: '',
  timezone: '',
  skills: '',
  socialLinks: {
    website: '',
    github: '',
    linkedin: '',
    x: ''
  }
};

const defaultPasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

const joinSkills = (skills) => {
  if (!Array.isArray(skills)) {
    return '';
  }

  return skills.join(', ');
};

const normalizeSkills = (skills) => {
  return String(skills || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
};

const buildProfileFormValues = (user) => {
  return {
    name: user?.name || '',
    title: user?.title || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    timezone: user?.timezone || '',
    skills: joinSkills(user?.skills),
    socialLinks: {
      website: user?.socialLinks?.website || '',
      github: user?.socialLinks?.github || '',
      linkedin: user?.socialLinks?.linkedin || '',
      x: user?.socialLinks?.x || ''
    }
  };
};

const formatDateTime = (date) => {
  if (!date) {
    return 'Not set yet';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
};

export const ProfilePage = () => {
  const outletContext = useOutletContext();
  const currentUser = outletContext?.currentUser || null;
  const profileSummary = outletContext?.profileSummary || null;
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  const profileForm = useForm({
    defaultValues: defaultProfileValues
  });

  const passwordForm = useForm({
    defaultValues: defaultPasswordValues
  });

  const completionPercentage = profileSummary?.completion?.percentage ?? 0;
  const streakCurrent = profileSummary?.streak?.current ?? currentUser?.dailyStreak ?? 0;
  const streakBest = profileSummary?.streak?.best ?? currentUser?.bestStreak ?? 0;
  const timelineItems = profileSummary?.activityTimeline || [];

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    profileForm.reset(buildProfileFormValues(currentUser));
    setAvatarPreview(currentUser.avatarUrl || '');
    setSelectedAvatar(null);
    setMessage('');
  }, [currentUser, profileForm]);

  useEffect(() => {
    if (!selectedAvatar) {
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedAvatar);
    setAvatarPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedAvatar]);

  const profileMutation = useMutation({
    mutationFn: userService.updateMyProfile,
    onSuccess: async (response) => {
      setMessage(response?.message || 'Profile updated successfully.');
      await queryClient.invalidateQueries({ queryKey: ['workspace-user'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const avatarMutation = useMutation({
    mutationFn: userService.updateMyAvatar,
    onSuccess: async (response) => {
      setMessage(response?.message || 'Avatar updated successfully.');
      setSelectedAvatar(null);
      await queryClient.invalidateQueries({ queryKey: ['workspace-user'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const passwordMutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: async (response) => {
      setMessage(response?.message || 'Password updated successfully.');
      passwordForm.reset(defaultPasswordValues);
      await queryClient.removeQueries({ queryKey: ['workspace-user'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const avatarSource = useMemo(() => {
    return avatarPreview || currentUser?.avatarUrl || '';
  }, [avatarPreview, currentUser?.avatarUrl]);

  const onProfileSubmit = (formValues) => {
    setMessage('');
    profileMutation.mutate({
      ...formValues,
      skills: normalizeSkills(formValues.skills)
    });
  };

  const onPasswordSubmit = (formValues) => {
    setMessage('');
    passwordMutation.mutate({
      currentPassword: formValues.currentPassword,
      newPassword: formValues.newPassword
    });
  };

  const onAvatarUpload = () => {
    if (!selectedAvatar) {
      setMessage('Choose an image before uploading the avatar.');
      return;
    }

    setMessage('');
    avatarMutation.mutate(selectedAvatar);
  };

  return (
    <div className="space-y-6">
      <section className="surface-card overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500/20 via-sky-500/10 to-transparent px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <Link className="nav-chip w-fit" to="/dashboard">
                <FiArrowLeft />
                Back to dashboard
              </Link>
              <div className="space-y-2">
                <p className="section-label w-fit">User profile</p>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  Shape your identity inside Pulse.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Edit your public identity, upload a profile image, and keep your security settings close at hand.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
              {[
                { label: 'Profile completion', value: `${completionPercentage}%`, icon: FiZap },
                { label: 'Current streak', value: `${streakCurrent} days`, icon: FiActivity },
                { label: 'Best streak', value: `${streakBest} days`, icon: FiStar },
                { label: 'Skills listed', value: `${currentUser?.skills?.length || 0}`, icon: FiBarChart2 }
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                        <Icon />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className="mt-1 font-display text-xl font-semibold text-slate-950 dark:text-white">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-label w-fit">Profile details</p>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Update your bio, skills, and social links.
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar user={currentUser} size="lg" className="ring-4 ring-white/20 dark:ring-slate-900/20" />
              <div className="space-y-2">
                <label className="secondary-button cursor-pointer">
                  <FiImage />
                  Select avatar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setSelectedAvatar(file);
                    }}
                  />
                </label>
                <button type="button" className="primary-button w-full" onClick={onAvatarUpload} disabled={avatarMutation.isPending}>
                  <FiUpload />
                  {avatarMutation.isPending ? 'Uploading...' : 'Upload avatar'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Avatar preview</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="h-24 w-24 overflow-hidden rounded-[28px] bg-slate-200 dark:bg-slate-800">
                {avatarSource ? (
                  <img src={avatarSource} alt={currentUser?.name || 'User avatar'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-400 to-sky-500 text-2xl font-bold text-slate-950">
                    {currentUser?.name?.slice(0, 1)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-950 dark:text-white">{selectedAvatar?.name || currentUser?.name || 'User'}</p>
                <p>{currentUser?.title || 'Add a title to make your workspace feel more personal.'}</p>
                <p>{currentUser?.location || 'Add a location or timezone for better context.'}</p>
              </div>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Name</span>
                <input className="input-shell" {...profileForm.register('name', { required: 'Name is required' })} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Title</span>
                <input className="input-shell" placeholder="Founder, creator, engineer" {...profileForm.register('title')} />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Bio</span>
              <textarea className="input-shell min-h-[120px] resize-y" placeholder="Write a short bio..." {...profileForm.register('bio')} />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Location</span>
                <input className="input-shell" placeholder="Bengaluru, India" {...profileForm.register('location')} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Website</span>
                <input className="input-shell" placeholder="https://example.com" {...profileForm.register('website')} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Timezone</span>
                <input className="input-shell" placeholder="Asia/Calcutta" {...profileForm.register('timezone')} />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Skills</span>
              <input className="input-shell" placeholder="React, Node.js, Product Design" {...profileForm.register('skills')} />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">GitHub</span>
                <input className="input-shell" placeholder="github.com/username" {...profileForm.register('socialLinks.github')} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">LinkedIn</span>
                <input className="input-shell" placeholder="linkedin.com/in/username" {...profileForm.register('socialLinks.linkedin')} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">X / Twitter</span>
                <input className="input-shell" placeholder="x.com/username" {...profileForm.register('socialLinks.x')} />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Portfolio</span>
                <input className="input-shell" placeholder="yourportfolio.com" {...profileForm.register('socialLinks.website')} />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="primary-button" disabled={profileMutation.isPending}>
                <FiSave />
                {profileMutation.isPending ? 'Saving...' : 'Save profile'}
              </button>
              <button type="button" className="secondary-button" onClick={() => profileForm.reset(buildProfileFormValues(currentUser))}>
                Reset form
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-6">
          <section className="surface-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-label w-fit">Workspace snapshot</p>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Progress at a glance
                </h3>
              </div>
              <FiBarChart2 className="text-2xl text-cyan-500" />
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Profile completion</span>
                  <span className="font-semibold text-slate-950 dark:text-white">{completionPercentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                  <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{ width: `${completionPercentage}%` }} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] bg-[rgb(var(--bg-elevated))] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Last active</p>
                  <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">{formatDateTime(currentUser?.lastActiveAt || currentUser?.updatedAt)}</p>
                </div>
                <div className="rounded-[24px] bg-[rgb(var(--bg-elevated))] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Email verified</p>
                  <p className="mt-2 text-sm font-medium text-slate-950 dark:text-white">
                    {currentUser?.emailVerifiedAt ? formatDateTime(currentUser.emailVerifiedAt) : 'Pending verification'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Tasks', value: profileSummary?.stats?.tasksCompleted || 0 },
                  { label: 'Notes', value: profileSummary?.stats?.notesCreated || 0 },
                  { label: 'Posts', value: profileSummary?.stats?.timelinePosts || 0 }
                ].map((item) => (
                  <div key={item.label} className="rounded-[24px] bg-[rgb(var(--bg-elevated))] p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="mt-3 font-display text-2xl font-semibold text-slate-950 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="surface-card p-6">
            <div className="flex items-center gap-3">
              <FiActivity className="text-xl text-cyan-500" />
              <div>
                <p className="section-label w-fit">Activity timeline</p>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Recent milestones
                </h3>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {timelineItems.map((item) => (
                <div key={`${item.label}-${item.detail}`} className="rounded-[24px] bg-[rgb(var(--bg-elevated))] p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                      <FiClock />
                    </div>
                    <div>
                      <p className="font-medium text-slate-950 dark:text-white">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section id="security" className="surface-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="section-label w-fit">Security</p>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Change your password when you need a fresh start.
            </h3>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              This updates your password and revokes other sessions so your account stays protected.
            </p>
          </div>

          <div className="flex min-w-0 flex-1 max-w-2xl flex-col gap-4">
            <form className="grid gap-4 md:grid-cols-3" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Current password</span>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" className="input-shell pl-11" {...passwordForm.register('currentPassword', { required: 'Current password is required' })} />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">New password</span>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    className="input-shell pl-11"
                    {...passwordForm.register('newPassword', {
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Use at least 8 characters' }
                    })}
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Confirm</span>
                <div className="relative">
                  <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    className="input-shell pl-11"
                    {...passwordForm.register('confirmPassword', {
                      required: 'Please confirm the new password',
                      validate: (value) => value === passwordForm.watch('newPassword') || 'Passwords do not match'
                    })}
                  />
                </div>
              </label>

              <div className="md:col-span-3 flex flex-wrap gap-3">
                <button type="submit" className="primary-button" disabled={passwordMutation.isPending}>
                  <FiLock />
                  {passwordMutation.isPending ? 'Updating password...' : 'Update password'}
                </button>
                <button type="button" className="secondary-button" onClick={() => passwordForm.reset()}>
                  Reset security form
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {message ? (
        <div className="surface-card flex items-center justify-between gap-4 px-5 py-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
          <span className="nav-chip">
            <FiZap />
            Saved
          </span>
        </div>
      ) : null}
    </div>
  );
};

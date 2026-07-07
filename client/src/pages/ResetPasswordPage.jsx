import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FiArrowRight, FiLock, FiMail, FiShield } from 'react-icons/fi';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

import { AuthShell } from '../components/AuthShell';
import { authService } from '../services/auth';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const emailFromQuery = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const tokenFromQuery = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: emailFromQuery,
      token: tokenFromQuery,
      password: '',
      confirmPassword: ''
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: (response) => {
      setMessage(response?.message || 'Password updated successfully.');
      navigate('/login', { replace: true });
    }
  });

  const onSubmit = async (formValues) => {
    setMessage('');
    const { confirmPassword, ...payload } = formValues;
    resetPasswordMutation.mutate(payload);
  };

  const passwordValue = watch('password');

  return (
    <AuthShell
      eyebrow="Reset password"
      title="Create a new password and jump back in."
      description="Use the secure token from your email to set a fresh password."
      points={['Short-lived token', 'Session revocation', 'Immediate recovery']}
      footer={
        <span>
          Need a new link?{' '}
          <Link className="font-semibold text-cyan-500 hover:text-cyan-400" to="/forgot-password">
            Request another
          </Link>
        </span>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="section-label w-fit">Reset password</p>
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Set a new secret and continue.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Enter the 6-digit code sent to your email to reset your password.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</span>
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" className="input-shell pl-11" placeholder="you@example.com" {...register('email', { required: 'Email is required' })} />
            </div>
            {errors.email ? <span className="text-sm text-rose-500">{errors.email.message}</span> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">6-Digit Code</span>
            <div className="relative">
              <FiShield className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" maxLength={6} className="input-shell pl-11 tracking-widest text-lg font-semibold" placeholder="123456" {...register('token', { 
                required: 'Code is required',
                pattern: { value: /^\d{6}$/, message: 'Code must be exactly 6 digits' } 
              })} />
            </div>
            {errors.token ? <span className="text-sm text-rose-500">{errors.token.message}</span> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">New password</span>
            <div className="relative">
              <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                className="input-shell pl-11"
                placeholder="********"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Use at least 8 characters' }
                })}
              />
            </div>
            {errors.password ? <span className="text-sm text-rose-500">{errors.password.message}</span> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Confirm password</span>
            <div className="relative">
              <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                className="input-shell pl-11"
                placeholder="Repeat the new password"
                {...register('confirmPassword', {
                  required: 'Please confirm the password',
                  validate: (value) => value === passwordValue || 'Passwords do not match'
                })}
              />
            </div>
            {errors.confirmPassword ? <span className="text-sm text-rose-500">{errors.confirmPassword.message}</span> : null}
          </label>

          <button type="submit" className="primary-button w-full" disabled={resetPasswordMutation.isPending}>
            {resetPasswordMutation.isPending ? 'Updating password...' : 'Update password'}
            <FiArrowRight />
          </button>
        </form>

        {message ? (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-700 dark:text-cyan-300">
            {message}
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
};

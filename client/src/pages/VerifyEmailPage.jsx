import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FiArrowRight, FiMail, FiShield } from 'react-icons/fi';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { AuthShell } from '../components/AuthShell';
import { authService } from '../services/auth';

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const emailFromQuery = useMemo(() => searchParams.get('email') || location.state?.email || '', [location.state?.email, searchParams]);
  const tokenFromQuery = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: emailFromQuery,
      token: tokenFromQuery
    }
  });

  useEffect(() => {
    if (emailFromQuery) {
      setValue('email', emailFromQuery);
    }

    if (tokenFromQuery) {
      setValue('token', tokenFromQuery);
    }
  }, [emailFromQuery, setValue, tokenFromQuery]);

  const verifyMutation = useMutation({
    mutationFn: authService.verifyEmail,
    onSuccess: (response) => {
      setMessage(response?.message || 'Email verified successfully.');
      navigate('/dashboard', { replace: true });
    }
  });

  const resendMutation = useMutation({
    mutationFn: authService.resendVerification,
    onSuccess: (response) => {
      setMessage(response?.message || 'Verification email sent.');
    }
  });

  useEffect(() => {
    setAutoSubmitted(false);
  }, [emailFromQuery]);
  
  // Removed automatic submission since user now must enter the OTP manually.

  const onSubmit = async (formValues) => {
    setMessage('');
    verifyMutation.mutate(formValues);
  };

  return (
    <AuthShell
      eyebrow="Email verification"
      title="Confirm your inbox and unlock the workspace."
      description="Paste the token from your verification email or request a new one."
      points={['One-click verification', 'Secure token check', 'Account activation']}
      footer={
        <span>
          Back to{' '}
          <Link className="font-semibold text-cyan-500 hover:text-cyan-400" to="/login">
            sign in
          </Link>
        </span>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="section-label w-fit">Verify email</p>
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Enter your 6-digit code.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Check your email inbox and enter the 6-digit verification code below to activate your account.
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

          <button type="submit" className="primary-button w-full" disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? 'Verifying...' : 'Verify email'}
            <FiArrowRight />
          </button>
        </form>

        <button
          type="button"
          className="secondary-button w-full"
          onClick={() => resendMutation.mutate({ email: getValues('email') || emailFromQuery || '' })}
          disabled={resendMutation.isPending}
        >
          {resendMutation.isPending ? 'Sending...' : 'Resend verification email'}
        </button>

        {location.state?.notice ? (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-700 dark:text-cyan-300">
            {location.state.notice}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-700 dark:text-cyan-300">
            {message}
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
};

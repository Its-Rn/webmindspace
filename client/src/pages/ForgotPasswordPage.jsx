import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FiArrowRight, FiMail } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import { AuthShell } from '../components/AuthShell';
import { authService } from '../services/auth';

export const ForgotPasswordPage = () => {
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: ''
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: (response) => {
      setMessage(response?.message || 'If the account exists, a reset link was sent.');
    }
  });

  const onSubmit = async (formValues) => {
    setMessage('');
    forgotPasswordMutation.mutate(formValues);
  };

  return (
    <AuthShell
      eyebrow="Password recovery"
      title="Reset access without losing your flow."
      description="We’ll send a secure reset link to the email tied to your account."
      points={['Secure reset link', 'One-hour token', 'Email delivery fallback']}
      footer={
        <span>
          Remembered your password?{' '}
          <Link className="font-semibold text-cyan-500 hover:text-cyan-400" to="/login">
            Sign in
          </Link>
        </span>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="section-label w-fit">Forgot password</p>
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Enter the email on your account.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            We’ll send a recovery email if the account exists. This avoids exposing account status.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</span>
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                className="input-shell pl-11"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required'
                })}
              />
            </div>
            {errors.email ? <span className="text-sm text-rose-500">{errors.email.message}</span> : null}
          </label>

          <button type="submit" className="primary-button w-full" disabled={forgotPasswordMutation.isPending}>
            {forgotPasswordMutation.isPending ? 'Sending link...' : 'Send reset link'}
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


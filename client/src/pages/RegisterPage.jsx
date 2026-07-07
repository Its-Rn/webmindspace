import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiArrowRight, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

import { authService } from '../services/auth';
import { useToast } from '../context/ToastContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: { name: '', email: '', password: '' }
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (response) => {
      toast.success(response?.message || 'Registration complete!');
      navigate(`/verify-email?email=${encodeURIComponent(response?.data?.user?.email || '')}`, {
        replace: true,
        state: { notice: response?.message }
      });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Unable to create account.');
    }
  });

  const onSubmit = (formValues) => registerMutation.mutate(formValues);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8 shadow-2xl shadow-slate-900/10 dark:shadow-black/20 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-xl font-bold text-slate-950 shadow-lg shadow-cyan-400/20">
              P
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Start your productivity journey today.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
              <div className="relative">
                <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoComplete="name"
                  className="input-shell pl-11"
                  placeholder="Alex Morgan"
                  {...register('name', { required: 'Name is required' })}
                />
              </div>
              {errors.name && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-rose-500">
                  {errors.name.message}
                </motion.p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  className="input-shell pl-11"
                  placeholder="you@example.com"
                  {...register('email', { required: 'Email is required' })}
                />
              </div>
              {errors.email && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-rose-500">
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  autoComplete="new-password"
                  className="input-shell pl-11"
                  placeholder="Create a strong password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Use at least 8 characters' }
                  })}
                />
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-rose-500">
                  {errors.password.message}
                </motion.p>
              )}
            </div>

            <motion.button
              type="submit"
              className="primary-button w-full"
              disabled={isSubmitting || registerMutation.isPending}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
            >
              {isSubmitting || registerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                <>
                  Create account <FiArrowRight />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-cyan-500 transition-colors hover:text-cyan-400">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiArrowRight, FiLock, FiMail } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { authService } from '../services/auth';
import { useToast } from '../context/ToastContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: { email: '', password: '' }
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (response) => {
      queryClient.removeQueries({ queryKey: ['workspace-user'] });
      toast.success(response?.message || 'Signed in successfully.');
      const nextPath = location.state?.from?.pathname || '/dashboard';
      navigate(nextPath, { replace: true });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Invalid email or password.');
    }
  });

  const onSubmit = (formValues) => loginMutation.mutate(formValues);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8 shadow-2xl shadow-slate-900/10 dark:shadow-black/20 sm:p-10">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-xl font-bold text-slate-950 shadow-lg shadow-cyan-400/20">
              P
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sign in to your workspace to continue.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-cyan-500 transition-colors hover:text-cyan-400">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  autoComplete="current-password"
                  className="input-shell pl-11"
                  placeholder="Enter your password"
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
              disabled={isSubmitting || loginMutation.isPending}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
            >
              {isSubmitting || loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign in <FiArrowRight />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[rgb(var(--border))]" />
            <span className="text-xs font-medium text-slate-400">OR</span>
            <div className="h-px flex-1 bg-[rgb(var(--border))]" />
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-cyan-500 transition-colors hover:text-cyan-400">
              Create one
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Demo accounts</p>
            <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <p><strong>Admin:</strong> kunal@gmail.com / 2212Aryan@3</p>
              <p><strong>User:</strong> aryan@gmail.com / 0902@Aryan3</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

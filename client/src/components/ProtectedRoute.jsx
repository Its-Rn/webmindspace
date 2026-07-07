import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import { userService } from '../services/user';
import { ErrorBoundary } from './ErrorBoundary';

const LoadingState = () => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="surface-card w-full max-w-sm space-y-4 p-8 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="mx-auto h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent"
        />
        <p className="text-sm text-slate-600 dark:text-slate-300">Checking your session...</p>
      </motion.div>
    </div>
  );
};

export const ProtectedRoute = () => {
  const location = useLocation();
  const currentUserQuery = useQuery({
    queryKey: ['workspace-user'],
    queryFn: userService.getMyProfile,
    retry: false,
    staleTime: 60 * 1000
  });

  if (currentUserQuery.isLoading) {
    return <LoadingState />;
  }

  if (currentUserQuery.isError) {
    const statusCode = currentUserQuery.error?.response?.status;

    if (statusCode === 401 || statusCode === 403) {
      return <Navigate replace state={{ from: location }} to="/login" />;
    }

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="surface-card w-full max-w-lg space-y-4 p-8 text-center">
          <p className="section-label mx-auto w-fit">Session error</p>
          <h2 className="font-display text-2xl font-semibold text-slate-950 dark:text-white">
            We could not load your workspace.
          </h2>
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
            Please try again in a moment or sign in again if the session expired.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link className="primary-button" to="/login" state={{ from: location }}>
              Sign in
            </Link>
            <Link className="secondary-button" to="/">
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Outlet
        context={{
          currentUser: currentUserQuery.data?.data?.user || null,
          profileSummary: currentUserQuery.data?.data?.summary || null
        }}
      />
    </ErrorBoundary>
  );
};

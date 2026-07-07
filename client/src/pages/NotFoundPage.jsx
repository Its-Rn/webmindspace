import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

export const NotFoundPage = () => {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
      <div className="surface-card w-full space-y-6 p-8 text-center">
        <p className="section-label mx-auto w-fit">404</p>
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
            This page is still under construction.
          </h1>
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
            The route you requested has not been built yet. Return to the home page or dashboard to continue.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link className="primary-button" to="/">
            <FiArrowLeft />
            Back home
          </Link>
          <Link className="secondary-button" to="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
};


import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

import { authService } from '../services/auth';
import { disconnectSocket } from '../services/socket';
import { UserAvatar } from './UserAvatar';

export const UserMenu = ({ user }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      disconnectSocket();
    },
    onSettled: () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  });

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-3 py-2 outline-none transition-transform duration-200 hover:-translate-y-0.5">
        <UserAvatar user={user} size="sm" />
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold text-[rgb(var(--text))]">{user?.name || 'User'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{user?.title || 'Personal workspace'}</p>
        </div>
      </summary>

      <div className="absolute right-0 z-20 mt-3 w-64 overflow-hidden rounded-[24px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-2 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <div className="border-b border-[rgb(var(--border))] px-4 py-3">
          <p className="text-sm font-semibold text-[rgb(var(--text))]">{user?.name || 'User'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || ''}</p>
        </div>
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[rgb(var(--text))] transition-colors hover:bg-cyan-500/10"
        >
          <FiUser className="text-cyan-500" />
          Profile
        </Link>
        <Link
          to="/profile#security"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[rgb(var(--text))] transition-colors hover:bg-cyan-500/10"
        >
          <FiSettings className="text-cyan-500" />
          Security
        </Link>
        <button
          type="button"
          onClick={() => logoutMutation.mutate()}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-[rgb(var(--text))] transition-colors hover:bg-rose-500/10"
          disabled={logoutMutation.isPending}
        >
          <FiLogOut className="text-rose-500" />
          {logoutMutation.isPending ? 'Signing out...' : 'Log out'}
        </button>
      </div>
    </details>
  );
};

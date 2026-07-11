import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiBell, FiCheck, FiCheckCircle, FiInbox, FiTrash2, FiMessageSquare, FiCalendar, FiBookOpen, FiInfo, FiShare2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../services/notification';
import { getSocket } from '../../services/socket';

const typeConfig = {
  chat: { icon: FiMessageSquare, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  share: { icon: FiShare2, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  blog_comment: { icon: FiBookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  task_reminder: { icon: FiCalendar, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  system: { icon: FiInfo, color: 'text-slate-500', bg: 'bg-slate-500/10' }
};

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    refetchInterval: 30000
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    };
    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [queryClient]);

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    }
  });

  const notifications = data?.data?.data || [];
  const unreadCount = data?.data?.unreadCount || 0;

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleOpenNotification = (notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiBell className="text-cyan-500" />
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-500">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="secondary-button text-sm"
          >
            <FiCheckCircle />
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--bg-elevated))]">
              <FiInbox className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.system;
            const Icon = config.icon;
            const senderLabel = notification.senderName || 'System';
            const contentLabel = notification.contentTitle || notification.title;
            return (
              <div
                key={notification._id}
                role={notification.link ? 'button' : undefined}
                tabIndex={notification.link ? 0 : undefined}
                onClick={() => handleOpenNotification(notification)}
                onKeyDown={(e) => {
                  if (notification.link && (e.key === 'Enter' || e.key === ' ')) {
                    handleOpenNotification(notification);
                  }
                }}
                className={`surface-card flex items-start gap-4 p-4 transition-colors ${
                  !notification.isRead ? 'border-l-2 border-l-cyan-500' : ''
                } ${notification.link ? 'cursor-pointer hover:bg-[rgb(var(--bg-elevated))]' : ''}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
                  <Icon className={config.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm ${notification.isRead ? 'text-slate-600 dark:text-slate-300' : 'font-semibold text-slate-950 dark:text-white'}`}>
                        {contentLabel}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {senderLabel} • {formatTime(notification.createdAt)}
                      </p>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        notification.isRead
                          ? 'bg-slate-500/10 text-slate-500'
                          : 'bg-cyan-500/10 text-cyan-500'
                      }`}>
                        {notification.isRead ? 'Read' : 'Unread'}
                      </span>
                      {notification.message && (
                        <p className="mt-0.5 text-sm text-slate-500">{notification.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    {notification.link && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenNotification(notification);
                        }}
                        className="text-xs font-medium text-cyan-500 hover:underline"
                      >
                        View
                      </button>
                    )}
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(notification._id);
                        }}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        <FiCheck className="h-3 w-3" />
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(notification._id);
                      }}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500"
                    >
                      <FiTrash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

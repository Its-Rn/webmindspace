import { useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FiClock,
  FiImage,
  FiMessageSquare,
  FiMapPin,
  FiSend,
  FiTrash2,
  FiZap
} from 'react-icons/fi';

import { timelineService } from '../../services/timeline';

const formatRelative = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export const TimelinePage = () => {
  const queryClient = useQueryClient();
  const [newContent, setNewContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const textareaRef = useRef(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['timeline-posts'],
    queryFn: ({ pageParam = 1 }) => timelineService.listPosts({ page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data?.pagination || {};
      return page < pages ? page + 1 : undefined;
    },
    staleTime: 30 * 1000
  });

  const createMutation = useMutation({
    mutationFn: timelineService.createPost,
    onSuccess: () => {
      setNewContent('');
      setMediaUrl('');
      setShowMediaInput(false);
      queryClient.invalidateQueries({ queryKey: ['timeline-posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: timelineService.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const pinMutation = useMutation({
    mutationFn: timelineService.togglePin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-posts'] });
    }
  });

  const posts = data?.pages?.flatMap((page) => page.data?.posts || []) || [];
  const allLoaded = !hasNextPage && posts.length > 0;

  const handleSubmit = () => {
    const content = newContent.trim();
    if (!content) return;
    createMutation.mutate({ content, mediaUrl: mediaUrl.trim() || undefined });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="surface-card overflow-hidden p-6 sm:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
            <FiClock />
          </div>
          <div>
            <p className="section-label w-fit">Timeline feed</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Share your thoughts.
            </h2>
          </div>
        </div>

        <div className="mt-5 rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-4">
          <textarea
            ref={textareaRef}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind? (Enter to post, Shift+Enter for new line)"
            className="input-shell min-h-[80px] resize-none border-0 bg-transparent p-0 focus:ring-0"
            maxLength={2000}
          />
          {showMediaInput && (
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Media URL (optional)"
              className="input-shell mt-3"
            />
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowMediaInput(!showMediaInput)}
              className={`nav-chip ${showMediaInput ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-500' : ''}`}
            >
              <FiImage />
              Media
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{newContent.length}/2000</span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!newContent.trim() || createMutation.isPending}
                className="primary-button"
              >
                <FiSend />
                {createMutation.isPending ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <FiMessageSquare className="mx-auto text-4xl text-slate-400" />
          <h3 className="mt-4 font-display text-xl font-semibold text-slate-950 dark:text-white">No posts yet</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Share your first thought to start building your timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`surface-card p-5 ${post.isPinned ? 'ring-1 ring-cyan-400/30' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                    <FiClock />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-950 dark:text-white">
                        {post.author?.name || 'You'}
                      </span>
                      {post.isPinned && (
                        <span className="text-[10px] text-cyan-500 flex items-center gap-1">
                          <FiMapPin className="text-xs" /> Pinned
                        </span>
                      )}
                      <span className="text-xs text-slate-500">{formatRelative(post.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    {post.mediaUrl && (
                      <div className="mt-3 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                        <img src={post.mediaUrl} alt="Media" className="max-h-80 w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => pinMutation.mutate(post.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      post.isPinned ? 'text-cyan-500 bg-cyan-500/10' : 'text-slate-400 hover:text-cyan-500'
                    }`}
                    title={post.isPinned ? 'Unpin' : 'Pin to top'}
                  >
                    <FiMapPin className="text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete this post?')) deleteMutation.mutate(post.id);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          <div className="flex justify-center py-4">
            {isFetchingNextPage ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            ) : hasNextPage ? (
              <button type="button" className="secondary-button" onClick={() => fetchNextPage()}>
                Load more
              </button>
            ) : allLoaded ? (
              <span className="text-sm text-slate-500">You've reached the beginning.</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

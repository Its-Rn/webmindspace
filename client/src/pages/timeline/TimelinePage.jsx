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

const pastelCircle = [
  'bg-rose-200 dark:bg-rose-300/40',
  'bg-sky-200 dark:bg-sky-300/40',
  'bg-amber-200 dark:bg-amber-300/40',
  'bg-emerald-200 dark:bg-emerald-300/40',
  'bg-purple-200 dark:bg-purple-300/40',
  'bg-pink-200 dark:bg-pink-300/40',
  'bg-teal-200 dark:bg-teal-300/40',
  'bg-orange-200 dark:bg-orange-300/40',
  'bg-indigo-200 dark:bg-indigo-300/40',
  'bg-lime-200 dark:bg-lime-300/40',
];

const pastelBadge = [
  'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-300/30 dark:text-rose-200',
  'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-300/30 dark:text-sky-200',
  'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-300/30 dark:text-amber-200',
  'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-300/30 dark:text-emerald-200',
  'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-300/30 dark:text-purple-200',
  'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-300/30 dark:text-pink-200',
  'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-300/30 dark:text-teal-200',
  'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-300/30 dark:text-orange-200',
  'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-300/30 dark:text-indigo-200',
  'bg-lime-100 text-lime-700 border-lime-300 dark:bg-lime-300/30 dark:text-lime-200',
];

function groupByYear(posts) {
  const map = new Map();
  for (const p of posts) {
    const y = new Date(p.createdAt).getFullYear().toString();
    if (!map.has(y)) map.set(y, []);
    map.get(y).push(p);
  }
  return Array.from(map.entries()).map(([year, posts]) => ({ year, posts }));
}

function TimelineItem({ item, index, onDelete }) {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col md:flex-row items-start gap-6 md:gap-0 ${
        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
      }`}
    >
      <div className={`flex-1 w-full md:w-1/2 ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
        <div className="surface-card p-5 inline-block w-full max-w-lg">
          {item.year && (
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${pastelBadge[index % pastelBadge.length]}`}>
              {item.year}
            </span>
          )}
          {item.posts.map((post) => (
            <div key={post.id} className="mb-4 last:mb-0">
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{post.content}</p>
              {post.mediaUrl && (
                <div className="mt-2 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <img src={post.mediaUrl} alt="" className="max-h-60 w-full object-cover" />
                </div>
              )}
              <div className={`mt-2 flex items-center gap-2 ${isLeft ? 'md:justify-end' : ''}`}>
                <span className="text-xs text-slate-400">{formatRelative(post.createdAt)}</span>
                {post.isPinned && <FiMapPin className="text-xs text-cyan-500" />}
                <button
                  type="button"
                  onClick={() => onDelete(post.id)}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <FiTrash2 className="text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-1/2 top-6 z-10 hidden -translate-x-1/2 md:block">
        <div className={`h-10 w-10 rounded-full border-2 border-slate-900 dark:border-slate-100 ${pastelCircle[index % pastelCircle.length]} flex items-center justify-center shadow-md`}>
          <div className="h-2 w-2 rounded-full bg-slate-900 dark:bg-slate-100" />
        </div>
      </div>

      <div className="flex-1 hidden md:block" />
    </motion.div>
  );
}

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
  const groups = groupByYear(posts);

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
      ) : groups.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <FiMessageSquare className="mx-auto text-4xl text-slate-400" />
          <h3 className="mt-4 font-display text-xl font-semibold text-slate-950 dark:text-white">No posts yet</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Share your first thought to start building your timeline.
          </p>
        </div>
      ) : (
        <div className="relative py-8">
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-slate-300 dark:bg-slate-600 hidden md:block" />

          <div className="relative space-y-16">
            {groups.map((item, index) => (
              <TimelineItem key={item.year} item={item} index={index} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>

          <div className="flex justify-center py-8">
            {isFetchingNextPage ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            ) : hasNextPage ? (
              <button type="button" className="secondary-button" onClick={() => fetchNextPage()}>
                Load more
              </button>
            ) : allLoaded ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-slate-400 dark:text-slate-500 italic"
              >
                — End of timeline —
              </motion.p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
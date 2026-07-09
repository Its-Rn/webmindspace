import { useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FiCalendar,
  FiClock,
  FiFilter,
  FiImage,
  FiMapPin,
  FiMessageSquare,
  FiSearch,
  FiSend,
  FiTrash2,
  FiX,
} from 'react-icons/fi';

import { timelineService } from '../../services/timeline';

const formatFull = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const pastelCircle = [
  'bg-rose-200 dark:bg-rose-300/40', 'bg-sky-200 dark:bg-sky-300/40',
  'bg-amber-200 dark:bg-amber-300/40', 'bg-emerald-200 dark:bg-emerald-300/40',
  'bg-purple-200 dark:bg-purple-300/40', 'bg-pink-200 dark:bg-pink-300/40',
  'bg-teal-200 dark:bg-teal-300/40', 'bg-orange-200 dark:bg-orange-300/40',
  'bg-indigo-200 dark:bg-indigo-300/40', 'bg-lime-200 dark:bg-lime-300/40',
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

const yearBadgeColors = [
  'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-300/30 dark:text-rose-200',
  'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-300/30 dark:text-sky-200',
  'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-300/30 dark:text-amber-200',
  'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-300/30 dark:text-emerald-200',
  'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-300/30 dark:text-purple-200',
];

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
      <div className={`flex-1 w-full md:w-1/2 ${isLeft ? 'md:pr-14 md:text-right' : 'md:pl-14'}`}>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${yearBadgeColors[index % yearBadgeColors.length]}`}>
          {item.year}
        </span>
        <div className="space-y-4">
          {item.posts.map((post, pi) => (
            <div
              key={post.id}
              className={`surface-card p-4 border-l-4 ${
                post.isPinned ? 'border-cyan-400' : 'border-[rgb(var(--border))]'
              }`}
            >
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{post.content}</p>
              {post.mediaUrl && (
                <div className="mt-2 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <img src={post.mediaUrl} alt="" className="max-h-60 w-full object-cover" />
                </div>
              )}
              <div className={`mt-3 flex items-center gap-3 ${isLeft ? 'md:justify-end' : ''}`}>
                <span className="text-xs text-slate-400">{formatFull(post.createdAt)}</span>
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

      <div className="absolute left-1/2 top-3 z-10 hidden -translate-x-1/2 md:block">
        <div className={`h-10 w-10 rounded-full border-2 border-slate-900 dark:border-slate-100 ${pastelCircle[index % pastelCircle.length]} flex items-center justify-center shadow-md`}>
          <div className="h-2 w-2 rounded-full bg-slate-900 dark:bg-slate-100" />
        </div>
      </div>

      <div className="flex-1 hidden md:block" />
    </motion.div>
  );
}

const years = [];
for (let y = new Date().getFullYear(); y >= 2020; y--) {
  years.push(y.toString());
}

export const TimelinePage = () => {
  const queryClient = useQueryClient();
  const [newContent, setNewContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const textareaRef = useRef(null);

  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = useMemo(() => {
    const params = { page: 1, limit: 10 };
    if (search.trim()) params.search = search.trim();
    if (filterYear) params.year = filterYear;
    if (filterMonth) params.month = filterMonth;
    if (filterStart) params.startDate = filterStart;
    if (filterEnd) params.endDate = filterEnd;
    return params;
  }, [search, filterYear, filterMonth, filterStart, filterEnd]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ['timeline-posts', queryParams],
    queryFn: ({ pageParam = 1 }) => timelineService.listPosts({ ...queryParams, page: pageParam }),
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

  const posts = data?.pages?.flatMap((page) => page.data?.posts || []) || [];
  const allLoaded = !hasNextPage && posts.length > 0;
  const groups = groupByYear(posts);

  const clearFilters = () => {
    setSearch('');
    setFilterYear('');
    setFilterMonth('');
    setFilterStart('');
    setFilterEnd('');
  };

  const hasFilters = search || filterYear || filterMonth || filterStart || filterEnd;

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

      {/* Search & Filters */}
      <div className="surface-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts by content..."
              className="input-shell w-full pl-9"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`nav-chip ${showFilters || hasFilters ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-500' : ''}`}
          >
            <FiFilter />
            Filters
          </button>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="nav-chip text-rose-500">
              <FiX />
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 grid gap-3 sm:grid-cols-4 overflow-hidden"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Year</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="input-shell w-full"
              >
                <option value="">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Month</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="input-shell w-full"
              >
                <option value="">All months</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
              <input
                type="date"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
                className="input-shell w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
              <input
                type="date"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
                className="input-shell w-full"
              />
            </div>
          </motion.div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : groups.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <FiMessageSquare className="mx-auto text-4xl text-slate-400" />
          <h3 className="mt-4 font-display text-xl font-semibold text-slate-950 dark:text-white">
            {hasFilters ? 'No matching posts' : 'No posts yet'}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {hasFilters
              ? 'Try adjusting your search or filters.'
              : 'Share your first thought to start building your timeline.'}
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
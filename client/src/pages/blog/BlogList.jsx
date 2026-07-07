import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiBookOpen,
  FiEdit3,
  FiFileText,
  FiGrid,
  FiList,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiZap
} from 'react-icons/fi';

import { blogService } from '../../services/blog';

export const BlogList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const postsQuery = useQuery({
    queryKey: ['blog-posts', { status: statusFilter === 'all' ? undefined : statusFilter }],
    queryFn: () => blogService.listPosts({ mine: 'true', status: statusFilter === 'all' ? undefined : statusFilter }),
    staleTime: 30 * 1000
  });

  const deleteMutation = useMutation({
    mutationFn: blogService.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const posts = postsQuery.data?.data?.posts || [];
  const query = searchTerm.trim().toLowerCase();

  const filteredPosts = useMemo(() => {
    if (!query) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.excerpt?.toLowerCase().includes(query) ||
        p.tags?.some((t) => t.toLowerCase().includes(query))
    );
  }, [query, posts]);

  const handleDelete = (post) => {
    if (window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(post.id);
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
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="section-label w-fit">Blog pipeline</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Manage your posts.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Draft, publish, and manage your blog content from one place.
            </p>
          </div>
          <button type="button" className="primary-button" onClick={() => navigate('/blog/new')}>
            <FiPlus />
            New post
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts by title, excerpt, or tags..."
              className="input-shell pl-11"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex overflow-hidden rounded-xl border border-[rgb(var(--border))]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-cyan-500/10 text-cyan-500' : 'text-slate-400'}`}
              >
                <FiGrid />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-cyan-500/10 text-cyan-500' : 'text-slate-400'}`}
              >
                <FiList />
              </button>
            </div>
            <div className="flex overflow-hidden rounded-xl border border-[rgb(var(--border))]">
              {['all', 'draft', 'published'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 text-sm font-medium capitalize ${
                    statusFilter === s ? 'bg-cyan-500/10 text-cyan-500' : 'text-slate-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {postsQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <FiFileText className="mx-auto text-4xl text-slate-400" />
          <h3 className="mt-4 font-display text-xl font-semibold text-slate-950 dark:text-white">
            {query ? 'No posts match your search' : 'No posts yet'}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {query ? 'Try a different search term.' : 'Create your first post to get started.'}
          </p>
          {!query && (
            <button type="button" className="primary-button mt-6" onClick={() => navigate('/blog/new')}>
              <FiPlus />
              Create your first post
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="surface-card group relative overflow-hidden p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500">
                  <FiBookOpen />
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    post.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-amber-500/10 text-amber-500'
                  }`}
                >
                  {post.status}
                </span>
              </div>

              <Link to={`/blog/${post.slug}`} className="mt-4 block">
                <h3 className="font-display text-lg font-semibold text-slate-950 dark:text-white line-clamp-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
              </Link>

              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="nav-chip text-[10px]">{tag}</span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[rgb(var(--border))] pt-3 text-xs text-slate-500">
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/blog/${post.slug}/edit`)}
                    className="hover:text-cyan-500 transition-colors"
                    title="Edit"
                  >
                    <FiEdit3 />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(post)}
                    className="hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <div key={post.id} className="surface-card flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                <FiFileText />
              </div>
              <Link to={`/blog/${post.slug}`} className="min-w-0 flex-1">
                <p className="font-medium text-slate-950 dark:text-white truncate">{post.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{post.excerpt || 'No excerpt'}</p>
              </Link>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                  post.status === 'published'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                {post.status}
              </span>
              <span className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</span>
              <button
                type="button"
                onClick={() => navigate(`/blog/${post.slug}/edit`)}
                className="nav-chip hover:text-cyan-500"
              >
                <FiEdit3 />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(post)}
                className="nav-chip hover:text-red-500"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
          {deleteMutation.isPending && (
            <div className="flex items-center gap-2 rounded-2xl bg-cyan-500/10 p-4 text-sm text-cyan-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              Deleting post...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

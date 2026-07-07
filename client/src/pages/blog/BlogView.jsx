import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiEdit3,
  FiEye,
  FiUser
} from 'react-icons/fi';

import { blogService } from '../../services/blog';

const formatDate = (date) => {
  if (!date) return null;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(new Date(date));
};

export const BlogView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const postQuery = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => blogService.getPost(slug),
    staleTime: 60 * 1000
  });

  if (postQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (postQuery.isError) {
    return (
      <div className="surface-card p-8 text-center">
        <FiBookOpen className="mx-auto text-4xl text-slate-400" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-slate-950 dark:text-white">Post not found</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This post may have been deleted or the link is invalid.
        </p>
        <button type="button" className="primary-button mt-6" onClick={() => navigate('/blog')}>
          Back to blog
        </button>
      </div>
    );
  }

  const post = postQuery.data?.data?.post;
  if (!post) return null;

  return (
    <div className="space-y-6">
      <div className="surface-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" className="nav-chip w-fit" onClick={() => navigate('/blog')}>
            <FiArrowLeft />
            Back to blog
          </button>
          {post.status === 'draft' && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              Draft
            </span>
          )}
        </div>
      </div>

      <article className="surface-card overflow-hidden">
        {post.coverImage && (
          <div className="aspect-[2/1] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-8 lg:p-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            {post.author && (
              <span className="flex items-center gap-2">
                <FiUser />
                {post.author.name}
              </span>
            )}
            <span className="flex items-center gap-2">
              <FiCalendar />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
            <span className="flex items-center gap-2">
              <FiClock />
              {new Date(post.updatedAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-2">
              <FiEye />
              {post.status}
            </span>
          </div>

          {post.excerpt && (
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300 border-l-4 border-cyan-500/30 pl-4">
              {post.excerpt}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags?.map((tag) => (
              <span key={tag} className="nav-chip">{tag}</span>
            ))}
            {post.categories?.map((cat) => (
              <span key={cat} className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-500">
                {cat}
              </span>
            ))}
          </div>

          <div className="mt-8 border-t border-[rgb(var(--border))] pt-8">
            <div className="prose prose-slate dark:prose-invert max-w-none text-sm leading-8 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
              {post.content || 'No content yet.'}
            </div>
          </div>
        </div>
      </article>

      <div className="flex flex-wrap gap-3">
        <Link className="primary-button" to={`/blog/${post.slug}/edit`}>
          <FiEdit3 />
          Edit post
        </Link>
        <Link className="secondary-button" to="/blog">
          <FiArrowLeft />
          All posts
        </Link>
      </div>
    </div>
  );
};

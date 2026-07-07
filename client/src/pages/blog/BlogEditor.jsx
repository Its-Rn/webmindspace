import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiExternalLink, FiEye, FiSave, FiSend, FiZap } from 'react-icons/fi';

import { blogService } from '../../services/blog';
import { useToast } from '../../context/ToastContext';

const defaultValues = {
  title: '',
  content: '',
  excerpt: '',
  coverImage: '',
  status: 'draft',
  tags: '',
  categories: '',
  seoTitle: '',
  seoDescription: '',
  seoOgImage: ''
};

const buildPayload = (data) => ({
  title: data.title,
  content: data.content,
  excerpt: data.excerpt,
  coverImage: data.coverImage,
  status: data.status,
  tags: data.tags
    ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [],
  categories: data.categories
    ? data.categories.split(',').map((c) => c.trim()).filter(Boolean)
    : [],
  seo: {
    title: data.seoTitle || '',
    description: data.seoDescription || '',
    ogImage: data.seoOgImage || ''
  }
});

const fillFormFromPost = (post) => ({
  title: post.title || '',
  content: post.content || '',
  excerpt: post.excerpt || '',
  coverImage: post.coverImage || '',
  status: post.status || 'draft',
  tags: (post.tags || []).join(', '),
  categories: (post.categories || []).join(', '),
  seoTitle: post.seo?.title || '',
  seoDescription: post.seo?.description || '',
  seoOgImage: post.seo?.ogImage || ''
});

export const BlogEditor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { slug } = useParams();
  const isEditing = Boolean(slug);
  const [message, setMessage] = useState('');

  const existingPostQuery = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => blogService.getPost(slug),
    enabled: isEditing,
    staleTime: 60 * 1000
  });

  const form = useForm({ defaultValues });

  useEffect(() => {
    if (existingPostQuery.data?.data?.post) {
      form.reset(fillFormFromPost(existingPostQuery.data.data.post));
    }
  }, [existingPostQuery.data, form]);

  const upsertMutation = useMutation({
    mutationFn: isEditing
      ? (payload) => blogService.updatePost(existingPostQuery.data.data.post.id, payload)
      : (payload) => blogService.createPost(payload),
    onSuccess: async (response) => {
      const post = response.data?.post;
      const successMsg = response?.message || (isEditing ? 'Post updated successfully.' : 'Post created successfully.');
      setMessage(successMsg);
      toast.success(successMsg);
      await queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      await queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      if (post?.slug) {
        if (post.status === 'published') {
          navigate(`/blog/${post.slug}`);
        } else if (post.slug !== slug) {
          navigate(`/blog/${post.slug}/edit`, { replace: true });
        }
      }
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || error.message || 'An error occurred while saving the post.';
      setMessage(errorMsg);
      toast.error(errorMsg);
    }
  });

  const onSubmit = (data) => {
    setMessage('');
    upsertMutation.mutate(buildPayload(data));
  };

  const handlePublish = () => {
    const currentValues = form.getValues();
    if (!currentValues.title?.trim()) {
      const warningMsg = 'Title is required before publishing.';
      setMessage(warningMsg);
      toast.warning(warningMsg);
      return;
    }
    form.setValue('status', 'published');
    form.handleSubmit((data) => {
      onSubmit({ ...data, status: 'published' });
    })();
  };

  const post = existingPostQuery.data?.data?.post;
  const isLoadingExisting = isEditing && existingPostQuery.isLoading;

  if (isLoadingExisting) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (isEditing && existingPostQuery.isError) {
    return (
      <div className="surface-card p-8 text-center">
        <h2 className="font-display text-xl font-semibold text-slate-950 dark:text-white">Post not found</h2>
        <p className="mt-2 text-sm text-slate-500">This post may have been deleted or the link is invalid.</p>
        <button type="button" className="primary-button mt-4" onClick={() => navigate('/blog')}>
          Back to blog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="surface-card p-6">
        <button type="button" className="nav-chip mb-4" onClick={() => navigate('/blog')}>
          <FiArrowLeft />
          Back to blog
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-label w-fit">{isEditing ? 'Edit post' : 'New post'}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {isEditing ? 'Refine your post.' : 'Draft something new.'}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="secondary-button" onClick={form.handleSubmit(onSubmit)} disabled={upsertMutation.isPending}>
              <FiSave />
              {upsertMutation.isPending ? 'Saving...' : 'Save draft'}
            </button>
            <button type="button" className="primary-button" onClick={handlePublish} disabled={upsertMutation.isPending}>
              <FiSend />
              {upsertMutation.isPending ? 'Publishing...' : 'Publish'}
            </button>
            {isEditing && post?.status === 'published' && (
              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="secondary-button">
                <FiExternalLink />
                View
              </a>
            )}
          </div>
        </div>
      </div>

      <form className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]" onSubmit={(e) => e.preventDefault()}>
        <div className="surface-card space-y-5 p-6">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Title *</span>
            <input className="input-shell text-lg font-semibold" placeholder="Enter a compelling title..." {...form.register('title', { required: true })} />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Content</span>
            <textarea
              className="input-shell min-h-[300px] resize-y font-mono text-sm leading-7"
              placeholder="Write your post content here... Supports plain text (Markdown-ready for future phases)."
              {...form.register('content')}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Excerpt</span>
            <textarea
              className="input-shell min-h-[80px] resize-y"
              placeholder="A short summary for previews and search results..."
              {...form.register('excerpt')}
            />
          </label>
        </div>

        <div className="space-y-6">
          <div className="surface-card space-y-5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Metadata</p>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Cover image URL</span>
              <input className="input-shell" placeholder="https://example.com/image.jpg" {...form.register('coverImage')} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tags</span>
              <input className="input-shell" placeholder="react, nodejs, design" {...form.register('tags')} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Categories</span>
              <input className="input-shell" placeholder="tech, lifestyle, tutorial" {...form.register('categories')} />
            </label>
          </div>

          <div className="surface-card space-y-5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">SEO</p>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Meta title</span>
              <input className="input-shell" placeholder="SEO-optimized title (max 120 chars)" {...form.register('seoTitle')} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Meta description</span>
              <textarea className="input-shell min-h-[60px] resize-y" placeholder="Search snippet description (max 320 chars)" {...form.register('seoDescription')} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">OG image URL</span>
              <input className="input-shell" placeholder="https://example.com/og-image.jpg" {...form.register('seoOgImage')} />
            </label>
          </div>
        </div>
      </form>

      {message ? (
        <div className={`surface-card flex items-center justify-between gap-4 px-5 py-4 border-l-4 ${
          upsertMutation.isError || message.includes('required')
            ? 'border-red-500 bg-red-500/5'
            : 'border-emerald-500 bg-emerald-500/5'
        }`}>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{message}</p>
          {(upsertMutation.isSuccess && !message.includes('required')) && (
            <span className="nav-chip bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <FiZap /> Saved
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
};

import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  content: z.string().default(''),
  excerpt: z.string().trim().max(500).default(''),
  coverImage: z.string().default(''),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z.array(z.string().trim()).default([]),
  categories: z.array(z.string().trim()).default([]),
  seo: z
    .object({
      title: z.string().max(120).default(''),
      description: z.string().max(320).default(''),
      ogImage: z.string().default('')
    })
    .default({})
});

export const updatePostSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().optional(),
  excerpt: z.string().trim().max(500).optional(),
  coverImage: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  tags: z.array(z.string().trim()).optional(),
  categories: z.array(z.string().trim()).optional(),
  seo: z
    .object({
      title: z.string().max(120).optional(),
      description: z.string().max(320).optional(),
      ogImage: z.string().optional()
    })
    .optional()
});

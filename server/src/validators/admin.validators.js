import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
  role: z.enum(['guest', 'user', 'writer', 'moderator', 'admin']).default('user'),
  isEmailVerified: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

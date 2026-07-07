import { z } from 'zod';

const optionalText = (maxLength) => z.string().trim().max(maxLength, `Must be ${maxLength} characters or less`).optional();

export const contactFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required').max(100, 'Name is too long'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address').toLowerCase(),
    company: optionalText(120),
    subject: z.string().trim().min(3, 'Subject is required').max(120, 'Subject is too long'),
    message: z.string().trim().min(20, 'Message should be at least 20 characters').max(2000, 'Message is too long')
  })
  .strict();

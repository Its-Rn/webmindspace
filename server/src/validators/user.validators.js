import { z } from 'zod';

const optionalText = (maxLength) => z.string().trim().max(maxLength, `Must be ${maxLength} characters or less`).optional();

const socialLinksSchema = z
  .object({
    website: optionalText(200),
    github: optionalText(200),
    linkedin: optionalText(200),
    x: optionalText(200)
  })
  .optional();

const skillsSchema = z
  .union([
    z.array(z.string().trim().min(1).max(40)).max(12),
    z.string().max(500)
  ])
  .optional();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
    title: optionalText(120),
    bio: optionalText(280),
    location: optionalText(120),
    website: optionalText(200),
    timezone: optionalText(80),
    skills: skillsSchema,
    socialLinks: socialLinksSchema
  })
  .strict();


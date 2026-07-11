import { z } from 'zod';

export const updateSettingsSchema = z.object({
  siteName: z.string().trim().min(1, 'Site name is required.').max(100).optional(),
  siteLogoText: z.string().trim().min(1, 'Site logo text is required.').max(10).optional(),
  siteTagline: z.string().trim().max(200).optional(),
  contactEmail: z.string().trim().email('Invalid contact email address.').optional(),
  customFooterText: z.string().trim().max(500).optional(),
  allowRegistration: z.boolean().optional(),
  allowTimelineDelete: z.boolean().optional(),
  allowTimelineEdit: z.boolean().optional(),
  landingPageContent: z.record(z.any()).optional()
});

import { asyncHandler } from '../utils/asyncHandler.js';
import { sendContactInquiry } from '../services/public.service.js';

export const submitContactForm = asyncHandler(async (req, res) => {
  const result = await sendContactInquiry(req.body);

  res.status(200).json({
    success: true,
    message: 'Thanks for reaching out. We will review your message shortly.',
    data: {
      preview: result.preview
    }
  });
});

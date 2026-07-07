import multer from 'multer';

import { AppError } from '../utils/appError.js';

const imageFilter = (req, file, callback) => {
  if (!file.mimetype.startsWith('image/')) {
    callback(new AppError('Only image files are allowed.', 400), false);
    return;
  }

  callback(null, true);
};

export const avatarUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});


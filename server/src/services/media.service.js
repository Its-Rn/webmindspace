import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';

import { appEnv } from '../config/env.js';
import { avatarsDir, ensureStorageDirectories } from '../config/storage.js';
import { cloudinary, configureCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { AppError } from '../utils/appError.js';

const ensureImageFile = (file) => {
  if (!file || !file.buffer) {
    throw new AppError('An image file is required.', 400);
  }
};

const getSafeExtension = (originalName = '') => {
  const extension = path.extname(originalName).toLowerCase();
  return extension || '.jpg';
};

const buildLocalAvatarUrl = (fileName) => {
  const baseUrl = appEnv.serverUrl.replace(/\/$/, '');
  return `${baseUrl}/uploads/avatars/${fileName}`;
};

const uploadToCloudinary = async (file) => {
  configureCloudinary();

  if (!isCloudinaryConfigured) {
    throw new AppError('Cloudinary is not configured.', 500);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'pulse/avatars',
        resource_type: 'image'
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed.'));
          return;
        }

        resolve({
          provider: 'cloudinary',
          url: result.secure_url,
          storageKey: result.public_id
        });
      }
    );

    Readable.from([file.buffer]).pipe(stream);
  });
};

const uploadToLocalStorage = async (file) => {
  await ensureStorageDirectories();

  const fileName = `avatar-${Date.now()}-${crypto.randomUUID()}${getSafeExtension(file.originalname)}`;
  const filePath = path.join(avatarsDir, fileName);

  await fs.writeFile(filePath, file.buffer);

  return {
    provider: 'local',
    url: buildLocalAvatarUrl(fileName),
    storageKey: fileName
  };
};

export const uploadAvatarFile = async (file) => {
  ensureImageFile(file);

  if (isCloudinaryConfigured) {
    return uploadToCloudinary(file);
  }

  return uploadToLocalStorage(file);
};

export const deleteStoredAvatar = async ({ provider, storageKey }) => {
  if (!storageKey) {
    return;
  }

  if (provider === 'cloudinary') {
    configureCloudinary();

    if (isCloudinaryConfigured) {
      await cloudinary.uploader.destroy(storageKey, {
        resource_type: 'image'
      });
    }

    return;
  }

  if (provider === 'local') {
    const filePath = path.join(avatarsDir, storageKey);
    await fs.unlink(filePath).catch(() => null);
  }
};


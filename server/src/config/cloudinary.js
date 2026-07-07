import { v2 as cloudinary } from 'cloudinary';

import { appEnv } from './env.js';

let configured = false;

export const isCloudinaryConfigured = Boolean(
  appEnv.cloudinaryCloudName && appEnv.cloudinaryApiKey && appEnv.cloudinaryApiSecret
);

export const configureCloudinary = () => {
  if (configured || !isCloudinaryConfigured) {
    return configured;
  }

  cloudinary.config({
    cloud_name: appEnv.cloudinaryCloudName,
    api_key: appEnv.cloudinaryApiKey,
    api_secret: appEnv.cloudinaryApiSecret,
    secure: true
  });

  configured = true;
  return configured;
};

export { cloudinary };


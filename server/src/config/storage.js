import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const serverRootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const uploadsRootDir = path.join(serverRootDir, 'uploads');
export const avatarsDir = path.join(uploadsRootDir, 'avatars');

export const ensureStorageDirectories = async () => {
  await fs.mkdir(avatarsDir, { recursive: true });
};


import fs from 'fs';

import { retryfy } from './retryfy';

export const writeFilePromise = retryfy(fs.promises.writeFile);
export const readFilePromise = retryfy(fs.promises.readFile);
export const unlinkPromise = retryfy(fs.promises.unlink);
export const readdirPromise = retryfy(fs.promises.readdir);
export const mkdirPromise = retryfy(fs.promises.mkdir);

export const isDirectoryExists = async (dir: string): Promise<boolean> => {
  return Boolean(await fs.promises.stat(dir).catch(() => false));
};
export const isFileExists = async (filePath: string): Promise<boolean> => {
  return Boolean(await fs.promises.stat(filePath).catch(() => false));
};
export const rmDir = async (dir: string) => {
  await fs.promises.rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
};

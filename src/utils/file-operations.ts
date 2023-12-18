import fs from 'fs';

import { Queue } from 'async-await-queue';

const queues = new Map<string, Queue<any>>();
const createQueue = () => {
  return new Queue(1, 0);
};

const singleFileBlockDecorator = <T>(
  func: (filePath: string, ...args: any[]) => Promise<T>,
): ((filePath: string, ...args: any[]) => Promise<T>) => {
  return async (filePath: string, ...args: any[]): Promise<T> => {
    const queueExist = queues.has(filePath);
    if (!queueExist) {
      const newQueue = createQueue();
      queues.set(filePath, newQueue);
    }
    const queueForFile = queues.get(filePath);
    if (!queueForFile) throw new Error('Queue not found');
    const uniq = Symbol('q');
    await queueForFile.wait(uniq);
    const data = await func(filePath, ...args);
    queueForFile.end(uniq);
    return data;
  };
};

export const writeFilePromise = singleFileBlockDecorator(fs.promises.writeFile);
export const readFilePromise = singleFileBlockDecorator(fs.promises.readFile);
export const unlinkPromise = singleFileBlockDecorator(fs.promises.unlink);
export const readdirPromise = fs.promises.readdir;
export const mkdirPromise = fs.promises.mkdir;

export const isDirectoryExists = async (dir: string): Promise<boolean> => {
  return Boolean(await fs.promises.stat(dir).catch(() => false));
};
export const isFileExists = async (filePath: string): Promise<boolean> => {
  return Boolean(await fs.promises.stat(filePath).catch(() => false));
};
export const rmDir = async (dir: string) => {
  await fs.promises.rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
};

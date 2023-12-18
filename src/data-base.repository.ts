import path from 'path';

import {
  isDirectoryExists,
  isFileExists,
  mkdirPromise,
  readdirPromise,
  readFilePromise,
  rmDir,
  unlinkPromise,
  writeFilePromise,
} from './utils/file-operations';
import { CacheDataError } from './errors';
import { logger } from './utils/logger';

const CACHE_GUARD_FILE = '.cacheFolder';

export class DataBaseRepository {
  private readonly rootFolderPath: string;
  private readonly collectionName: string = 'data';
  private readonly dataFolderPath: string;
  constructor({ rootFolderPath, collectionName }: { rootFolderPath: string; collectionName?: string }) {
    this.rootFolderPath = rootFolderPath;
    if (collectionName) {
      this.collectionName = collectionName;
    }
    this.dataFolderPath = path.join(rootFolderPath, this.collectionName);
  }

  static async create({ rootFolderPath, dataFolderName }: { rootFolderPath: string; dataFolderName?: string }) {
    try {
      const repository = new DataBaseRepository({ rootFolderPath, collectionName: dataFolderName });
      await repository.init();
      return repository;
    } catch (error) {
      logger.error(`Error while creating data base repository: ${error}`);
      throw new CacheDataError(`Error while creating data base repository: ${error}`);
    }
  }

  async init() {
    await this.savePrepareDataFolder();
    await this.clearExpired();
  }

  private async isGuardFileExists() {
    return await isFileExists(path.join(this.rootFolderPath, CACHE_GUARD_FILE));
  }

  private async rootFolderCanBeUsedForCache() {
    const isCacheDirectoryExists = await isDirectoryExists(this.rootFolderPath);
    const files = (isCacheDirectoryExists && (await readdirPromise(this.rootFolderPath))) || [];
    const isEmptyDir = isCacheDirectoryExists && files.length === 0;
    const isUsedForCacheBefore = await this.isGuardFileExists();

    return !isCacheDirectoryExists || isEmptyDir || isUsedForCacheBefore;
  }

  public async clear() {
    try {
      await this.cleanupDataFolder();
    } catch (error) {
      logger.error(`Error while cleaning data folder ${this.dataFolderPath}: ${error}`);
      throw new CacheDataError(`Error while cleaning data folder ${this.dataFolderPath}: ${error}`);
    }
  }

  private getFilePath(key: string) {
    return path.join(this.dataFolderPath, `${key}.json`);
  }

  public async get(key: string) {
    try {
      const rawData = await readFilePromise(this.getFilePath(key), 'utf8');
      if (!rawData) return null;
      const object = JSON.parse(rawData);
      if (object.expiresAt && new Date(object.expiresAt) < new Date()) {
        await this.delete(key);
        return null;
      }
      return object.value;
    } catch (error) {
      if (error instanceof Object && 'code' in error && error.code === 'ENOENT') {
        return null;
      }
      logger.error(`Error while reading data from file ${this.getFilePath(key)}: ${error}`);
      throw new CacheDataError(`Error while reading data from file ${this.getFilePath(key)}: ${error}`);
    }
  }

  public async set(key: string, value: any, ttl: number) {
    try {
      const ttlInMs = ttl * 1000;
      const data = JSON.stringify({
        key,
        value,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ttlInMs).toISOString(),
      });
      await writeFilePromise(this.getFilePath(key), data);
    } catch (error) {
      logger.error(`Error while saving data to file ${this.getFilePath(key)}: ${error}`);
      throw new CacheDataError(`Error while saving data to file ${this.getFilePath(key)}: ${error}`);
    }
  }

  public async delete(key: string) {
    try {
      await unlinkPromise(this.getFilePath(key));
    } catch (error) {
      logger.error(`Error while deleting file ${this.getFilePath(key)}: ${error}`);
      throw new CacheDataError(`Error while deleting file ${this.getFilePath(key)}: ${error}`);
    }
  }

  private async cleanupDataFolder() {
    const dataDirPath = this.dataFolderPath;
    const isDataDirectoryExists = await isDirectoryExists(dataDirPath);
    const dataFiles = isDataDirectoryExists ? await readdirPromise(dataDirPath) : [];
    if (isDataDirectoryExists) {
      await rmDir(dataDirPath);
    }
    await mkdirPromise(this.dataFolderPath, { recursive: true });
    if (dataFiles.length) {
      console.info(`Deleted ${dataFiles.length} files from ${dataDirPath}`);
    }
  }

  private async clearExpired() {
    try {
      const dataDirPath = this.dataFolderPath;
      const isDataDirectoryExists = await isDirectoryExists(dataDirPath);
      const dataFiles = isDataDirectoryExists ? await readdirPromise(dataDirPath) : [];
      for (const file of dataFiles) {
        try {
          const filePath = path.join(dataDirPath, file);
          const rawData = await readFilePromise(filePath, 'utf8');
          if (!rawData) continue;
          const object = JSON.parse(rawData);
          if (object.expiresAt && new Date(object.expiresAt) < new Date()) {
            await this.delete(object.key);
          }
        } catch (error) {
          logger.error(`Error while cleaning file ${file} from ${this.dataFolderPath}: ${error}`);
        }
      }
    } catch (error) {
      logger.error(`Error while cleaning expired data from ${this.dataFolderPath}: ${error}`);
      throw new CacheDataError(`Error while cleaning expired data from ${this.dataFolderPath}: ${error}`);
    }
  }

  private async savePrepareDataFolder() {
    try {
      const rootFolderCanBeUsedForCache = await this.rootFolderCanBeUsedForCache();
      if (!rootFolderCanBeUsedForCache) {
        throw new Error(`Directory ${this.rootFolderPath} is not empty. Please delete all files from it`);
      }
      await mkdirPromise(this.dataFolderPath, { recursive: true });
      await writeFilePromise(path.join(this.rootFolderPath, CACHE_GUARD_FILE), 'is database folder');
    } catch (error) {
      logger.error(`Error while saving data folder ${this.dataFolderPath}: ${error}`);
      throw new CacheDataError(`Error while saving data folder ${this.dataFolderPath}: ${error}`);
    }
  }
}

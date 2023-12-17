import {
  isDirectoryExists,
  isFileExists,
  mkdirPromise,
  readdirPromise, readFilePromise,
  rmDir, unlinkPromise,
  writeFilePromise
} from "./utils/file-operations";

const CACHE_GUARD_FILE = '.cacheFolder';

export class DataBaseRepository {
  private readonly rootFolderPath: string;
  private readonly collectionName: string = 'data';
  private readonly dataFolderPath: string;

  static async create({ rootFolderPath, dataFolderName }: { rootFolderPath: string, dataFolderName?: string }) {
    const repository = new DataBaseRepository({ rootFolderPath, collectionName: dataFolderName });
    await repository.init();
    return repository;
  }

  constructor({ rootFolderPath, collectionName }: { rootFolderPath: string, collectionName?: string }) {
    this.rootFolderPath = rootFolderPath;
    if(collectionName) {
      this.collectionName = collectionName;
    }
    this.dataFolderPath = `${rootFolderPath}/'${this.collectionName}'`;
  }

  async init() {
    await this.savePrepareDataFolder();
  }


  private isGuardFileExists = async () => {
    return await isFileExists(`${this.rootFolderPath}/${CACHE_GUARD_FILE}`);
  }

  private async rootFolderCanBeUsedForCache() {
    const isCacheDirectoryExists = await isDirectoryExists(this.rootFolderPath);
    const files = isCacheDirectoryExists && await readdirPromise(this.rootFolderPath) || [];
    const isEmptyDir = isCacheDirectoryExists && files.length === 0;
    const isUsedForCacheBefore = await this.isGuardFileExists();

    return (!isCacheDirectoryExists || isEmptyDir || isUsedForCacheBefore);
  }

  public async clear() {
    await this.cleanupDataFolder();
  }

  public async get(key: string) {
    const data = await readFilePromise(`${this.dataFolderPath}/${key}.json`, 'utf8');
    return JSON.parse(data).value;
  }

  public async set(key: string, value: any, ttl: number) {
    const data = JSON.stringify({
      key,
      value,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttl).toISOString()
    });
    await writeFilePromise(`${this.dataFolderPath}/${key}.json`, data);
  }

  public async delete(key: string) {
    await unlinkPromise(`${this.dataFolderPath}/${key}.json`);
  }

  private async cleanupDataFolder() {
    const dataDirPath = this.dataFolderPath;
    const isDataDirectoryExists = await isDirectoryExists(dataDirPath);
    const dataFiles = isDataDirectoryExists ? await readdirPromise(dataDirPath) : [];
    if(isDataDirectoryExists) {
      await rmDir(dataDirPath);
    }
    await mkdirPromise(this.dataFolderPath, { recursive: true });
    dataFiles.length && console.info(`Deleted ${dataFiles.length} files from ${dataDirPath}`)
  }
  private async savePrepareDataFolder() {
    let rootFolderCanBeUsedForCache = await this.rootFolderCanBeUsedForCache();
    if(!rootFolderCanBeUsedForCache) {
      throw new Error(`Directory ${this.rootFolderPath} is not empty. Please delete all files from it`);
    }
    await mkdirPromise(this.dataFolderPath, { recursive: true });
    await writeFilePromise(`${this.rootFolderPath}/${CACHE_GUARD_FILE}`, 'is database folder', 'utf8');
  }
}

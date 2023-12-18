import { DataBaseRepository } from "./data-base.repository";

const CACHE_DIR = '../.cache';
const OK_RESPONSE = 'ok';

async function createDataBase() {
  return await DataBaseRepository.create({
    rootFolderPath: CACHE_DIR,
    dataFolderName: 'data',
  });
}

export async function defineResolvers() {
  const dataBase = await createDataBase();
  return {
    Query: {
      get: async (_: any, { key }: { key: string }) => {
        return await dataBase.get(key);
      },
    },
    Mutation: {
      set: async (_: any, { key, value, ttl }: { key: string; value: string; ttl: number }) => {
        await dataBase.set(key, value, ttl);
        return OK_RESPONSE;
      },
      delete: async (_: any, { key }: { key: string }) => {
        await dataBase.delete(key);
        return OK_RESPONSE;
      },
      clear: async () => {
        await dataBase.clear();
        return OK_RESPONSE;
      },
    },
  };
}

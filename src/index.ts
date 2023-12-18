import { ApolloServer, gql } from 'apollo-server';

import { DataBaseRepository } from './data-base.repository';

const typeDefs = gql`
  scalar AnyType

  type Query {
    get(key: String!): String
  }
  type Mutation {
    set(key: String!, value: String!, ttl: Int!): String
    delete(key: String!): String
    clear: String
  }
`;

const CACHE_DIR = '../.cache';

(async () => {
  const dataBase = await DataBaseRepository.create({ rootFolderPath: CACHE_DIR, dataFolderName: 'data' });
  const resolvers = {
    Query: {
      get: async (_: any, { key }: { key: string }) => {
        return await dataBase.get(key);
      },
    },
    Mutation: {
      set: async (_: any, { key, value, ttl }: { key: string; value: string; ttl: number }) => {
        await dataBase.set(key, value, ttl);
        return 'ok';
      },
      delete: async (_: any, { key }: { key: string }) => {
        await dataBase.delete(key);
        return 'ok';
      },
      clear: async () => {
        await dataBase.clear();
        return 'ok';
      },
    },
  };
  const server = new ApolloServer({ typeDefs, resolvers });

  server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
})();

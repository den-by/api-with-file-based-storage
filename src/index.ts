import { ApolloServer } from 'apollo-server';

import { defineResolvers } from './resolvers';
import { typeDefs } from './type-defs';

async function init() {
  const resolvers = await defineResolvers();
  const server = new ApolloServer({ typeDefs, resolvers });

  try {
    const { url } = await server.listen();
    console.log(`🚀  Server ready at ${url}`);
  } catch (error) {
    console.error(`Error starting server: ${error}`);
  }
}

init();

import { gql } from "apollo-server";

export const typeDefs = gql`
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

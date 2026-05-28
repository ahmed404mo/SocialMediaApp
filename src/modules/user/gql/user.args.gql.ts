import { GraphQLInt, GraphQLString } from "graphql";

export const profile = {
  search: { type: GraphQLString },
  page: { type: GraphQLInt },
  size: { type: GraphQLInt },
};

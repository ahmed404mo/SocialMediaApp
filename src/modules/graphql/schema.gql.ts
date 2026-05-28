import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { userGQlSchema } from "../user";
import { postGQLSchema } from "../post";

const query = new GraphQLObjectType({
  name: "RootSchemaQuery",
  description: "optional text t enhance understand api",
  fields: {
    ...userGQlSchema.registerQuery(),
    ...postGQLSchema.registerQuery(),
  },
});

const mutation = new GraphQLObjectType({
  name: "RootSchemaMutation",
  description: "optional text t enhance understand api",
  fields: {
    ...userGQlSchema.registerMutation(),
    ...postGQLSchema.registerMutation(),
  },
});
export const schema = new GraphQLSchema({ query, mutation });

import {  GraphQLString } from "graphql";
import * as UserTypes from "./user.types.gql"
import * as UserArgs from "./user.args.gql"
import { userResolver, UserResolver } from "./user.resolver";

export class UserGQlSchema {
  private userResolver:UserResolver;
  constructor() {
    this.userResolver=userResolver
  }
  registerQuery() {
    return {
profile: {
  description: "test profile point",
  type:UserTypes.profile,
  args: UserArgs.profile,


  resolve:this.userResolver.profile
},};
  }
  registerMutation() {
    return {
      like: {
        type: GraphQLString,
        resolve: () => {
          return "mutation";
        },
      },
    };
  }
}

export const userGQlSchema = new UserGQlSchema()
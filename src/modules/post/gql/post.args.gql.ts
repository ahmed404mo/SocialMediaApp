import { GraphQLEnumType, GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
export const ReactGQLEnumType = new GraphQLEnumType({
    name : "ReactEnum",
    values:{
      Dislike:{value:0},
      like:{value:1}
    }
  })


export const postList = {
page:{type: GraphQLInt},
size:{type: GraphQLInt},
search:{type: GraphQLString}
}


export const reactOnPost = {
postId:{type: new GraphQLNonNull(GraphQLID)},
react:{
  type:ReactGQLEnumType
}
}

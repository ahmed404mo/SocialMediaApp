import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLList,
  GraphQLString,
} from "graphql";
import { GraphQLNonNull, GraphQLObjectType } from "graphql";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../../common/enums";

export const GenderGQLEnumType = new GraphQLEnumType({
  name: "GenderGQLEnumType",
  values: {
    Male: { value: GenderEnum.MALE },
    FEMAILE: { value: GenderEnum.FEMAILE },
  },
});
export const ProviderGQLEnumType = new GraphQLEnumType({
  name: "ProviderGQLEnumType",
  values: {
    GOOGLE: { value: ProviderEnum.GOOGLE },
    SYSTEM: { value: ProviderEnum.SYSTEM },
  },
});
export const RoleGQLEnumType = new GraphQLEnumType({
  name: "RoleGQLEnumType",
  values: {
    ADMIN: { value: RoleEnum.ADMIN },
    USER: { value: RoleEnum.USER },
  },
});

export const OneUserType: GraphQLObjectType = new GraphQLObjectType({
  name: "OneUserType",
  fields: () => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    slug: { type: new GraphQLNonNull(GraphQLString) },
    username: { type: GraphQLString },
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: GraphQLString },

    phone: { type: GraphQLString },
    profilePicture: { type: GraphQLString },
    profileCoverPicture: { type: new GraphQLList(GraphQLString) },

    changeCredentialsTime: { type: GraphQLString },
    DOB: { type: GraphQLString },
    confirmEmail: { type: GraphQLString },

    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    updatedAt: { type: GraphQLString },
    deletedAt: { type: GraphQLString },
    restoredAt: { type: GraphQLString },

    gender: { type: GenderGQLEnumType },
    role: { type: RoleGQLEnumType },
    provider: { type: ProviderGQLEnumType },
    friends: { type: new GraphQLList(OneUserType) },
  }),
});

export const profile = new GraphQLNonNull(
  new GraphQLObjectType({
    name: "ProfileResponse",
    description: "",
    fields: {
      message: { type: new GraphQLNonNull(GraphQLString) },
      data: {
        type: OneUserType,
      },
    },
  }),
);

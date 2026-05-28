import { type NextFunction, type Request, type Response } from "express";
import { forbiddenException, MapGraphQLError } from "../common/exceptions";
import { RoleEnum } from "../common/enums";
import { HydratedDocument } from "mongoose";
import { IUser } from "../common/interfaces";

export const authorization = (accessRoles: RoleEnum[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !accessRoles.includes(req.user.role)) {
      throw new forbiddenException("Not authorized account");
    }
    return next();
  };
};

export const GQLauthorization = async (
  accessRoles: RoleEnum[],
  user: HydratedDocument<IUser>,
): Promise<boolean> => {
  if (!accessRoles.includes(user.role)) {
    throw MapGraphQLError(new forbiddenException("not authorized account"));
  }
  return true;
};

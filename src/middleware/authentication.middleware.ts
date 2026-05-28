import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../common/exceptions";
import { TokenService } from "../common/services";
import { TokenTypeEnum } from "../common/enums";

export const authentication = (
  tokenType: TokenTypeEnum = TokenTypeEnum.ACCESS,
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const tokenService = new TokenService();

    const [key, credential] = req.headers?.authorization?.split(" ") || [];
    console.log({ key, credential });
    if (!key || !credential) {
      throw new UnauthorizedException("Missing authorization");
    }
    switch (key) {
      case "Basic":
        break;
      default:
        const { decoded, user } = await tokenService.decodeToken({
          token: credential,
          tokenType,
        });
        req.user = user;
        req.decoded = decoded;
        break;
    }

    next();
  };
};

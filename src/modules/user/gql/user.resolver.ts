import userService, { UserService } from "../user.service";
import { IUser } from "../../../common/interfaces";
import { IAuthUser } from "../../../common/types/express.types";
import { GQLauthorization, GQLValidation } from "../../../middleware";
import { endPoint } from "../user.authrization";
import { profileGQL } from "../user.validtion";

export class UserResolver {
  private userService: UserService;
  constructor() {
    this.userService = userService;
  }
  profile = async (parent: unknown, args:{search?:string} ,{user}:IAuthUser):Promise<{message:string, data:IUser}> => {
    await GQLValidation<{search?:string}>(profileGQL, args)
    await GQLauthorization(endPoint.profile, user)
    const data = await this.userService.profile(user);

    return { message: "Hello", data };
  };
}

export const userResolver = new UserResolver();

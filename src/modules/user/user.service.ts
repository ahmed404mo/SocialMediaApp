import { ChatEnum, LogoutEnum } from "../../common/enums";
import { ConflictException, NotFoundException } from "../../common/exceptions";
import { IChat, IUser } from "../../common/interfaces";
import {
  RedisService,
  redisService,
  TokenService,
} from "../../common/services";
import { REFRESH_EXPIRES_IN } from "../../config/config";
import { HydratedDocument } from "mongoose";
import { UserRepository } from "./../../DB/repository/user.repository";
import cloudinary from "../../DB/cloudinary/cloudinary.db";
import { ChatRepository } from "../../DB/repository/chat.repository";

export class UserService {
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;
  private readonly userRepository: UserRepository;
  private readonly chatRepository: ChatRepository;
  constructor() {
    this.redis = redisService;
    this.tokenService = new TokenService();
    this.userRepository = new UserRepository();
    this.chatRepository = new ChatRepository();
  }
  async profile(
    user: HydratedDocument<IUser>,
  ): Promise<{ user: IUser; groups: HydratedDocument<IChat>[] }> {
    await user.populate([{ path: "friends" }]);
    const groups = await this.chatRepository.find({
      filter: {
        participants: { $in: [user._id] },
        type:ChatEnum.ovm
      },
    });
    return { user: user.toJSON(), groups };
  }

  async getProfileById(
    userId: string,
  ): Promise<{ user: IUser; groups: HydratedDocument<IChat>[] }> {
    const user = await this.userRepository.findOne({ filter: { _id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    await user.populate([{ path: "friends" }]);
    const groups = await this.chatRepository.find({
      filter: {
        participants: { $in: [user._id] },
        type: ChatEnum.ovm,
      },
    });
    return { user: user.toJSON(), groups };
  }

  async logout(
    { flag }: { flag: LogoutEnum },
    user: HydratedDocument<IUser>,
    { jti, iat, sub }: { jti: string; iat: number; sub: string },
  ): Promise<number> {
    let status = 200;
    switch (flag) {
      case LogoutEnum.ALL:
        user.changeCredentialsTime = new Date();
        await user.save();
        await this.redis.deleteKey(
          await this.redis.keys(this.redis.baseRevokeTokenKey(sub)),
        );
        break;
      default:
        await this.tokenService.createRevokeToken({
          userId: sub,
          jti,
          ttl: iat + REFRESH_EXPIRES_IN,
        });
        status = 201;
        break;
    }

    return status;
  }

  async rotateToken(
    user: HydratedDocument<IUser>,
    { sub, jti, iat }: { jti: string; iat: number; sub: string },
    issuer: string,
  ) {
    if ((iat + REFRESH_EXPIRES_IN) * 1000 >= Date.now() + 30000) {
      throw new ConflictException("Current access token still valid");
    }
    await this.tokenService.createRevokeToken({
      userId: sub,
      jti,
      ttl: iat + REFRESH_EXPIRES_IN,
    });
    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  async deleteProfile(user: HydratedDocument<IUser>) {
    const folderPath = `users/${user._id.toString()}`;
    try {
      await cloudinary.api.delete_resources_by_prefix(`${folderPath}/`);
      await cloudinary.api.delete_folder(folderPath);
    } catch (error) {
      console.error("Cloudinary Deletion Error:", error);
    }
    const account = await this.userRepository.deleteOne({
      filter: { _id: user._id, force: true },
    });
    if (!account.deletedCount) {
      throw new NotFoundException("Invalid account");
    }
    return account;
  }
}

export default new UserService();

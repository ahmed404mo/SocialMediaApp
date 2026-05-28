import {
  redisService,
  RedisService,
  TokenService,
} from "../../common/services";
import { Server } from "socket.io";
import { Server as HttpServerType } from "node:http";
import { IAuthSoket } from "../../common/types/express.types";
import { TokenTypeEnum } from "../../common/enums";
import { chatGateway } from "../chat";

export class RealtimeGateway {
  private io!: Server;
  private tokenService: TokenService;
  private redisService: RedisService;
  constructor() {
    this.tokenService = new TokenService();
    this.redisService = redisService;
  }
  authentication = async (socket: IAuthSoket, next: any) => {
    try {
      const { user, decoded } = await this.tokenService.decodeToken({
        token: (socket.handshake.auth?.authorization ||
          socket.handshake.headers?.authorization) as string,
        tokenType: TokenTypeEnum.ACCESS,
      });
      socket.data = { user, decoded };
      await this.redisService.addSocket(user._id, socket.id);
      next();
    } catch (error) {
      next(error);
    }
  };

  initializeIo = (httpServer: HttpServerType) => {
    this.io = new Server(httpServer, {
      cors: { origin: "*" },
    });

    this.io.use(this.authentication as any);
    this.io.on("connection", async (socket: IAuthSoket) => {
chatGateway.registerEvents(socket, this.io)

      socket.on("disconnect", async () => {
        await this.redisService.removeSocket(socket.data.user._id, socket.id);
        const connections =
          (await this.redisService.getSockets(socket.data.user._id)) || [];
        if (connections.length < 1) {
          this.io.emit("offline_user", { userId: socket.data.user._id });
        }
      });
    });
  };

  getIo(){
    return this.io
  }


}

export const realTimeGateway = new RealtimeGateway()
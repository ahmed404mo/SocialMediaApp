import express from "express";
import {
  authRouter,
  postRouter,
  realTimeGateway,
  schema,
  userRouter,
} from "./modules";
import { authentication, globalErrorHandler } from "./middleware/index";
import { PORT } from "./config/config";
import connectDB from "./DB/connection.db";
import { redisService } from "./common/services";
import cors from "cors";
import { commentRouter } from "./modules/comment";
import { createHandler } from "graphql-http/lib/use/express";
import { Server as HttpServerType } from "node:http";
import { chatRouter } from "./modules/chat";

const bootstrap = async () => {
  const app: express.Express = express();
  app.use(express.json(), cors());

  app.all(
    "/graphql",
    authentication(),
    createHandler({
      schema: schema,
      context: (req) => {
        return { user: req.raw.user, decoded: req.raw.decoded };
      },
    }),
  );

  app.get(
    "/",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      res.status(200).json({ message: "landing page" });
    },
  );
  app.use("/:postId/comment", commentRouter);
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/post", postRouter);
  app.use("/chat", chatRouter);

  // application-error
  app.use(globalErrorHandler);
  await connectDB();
  await redisService.connect();

  app.use((req: express.Request, res: express.Response) => {
    res.status(404).json({ message: "invalid application routing" });
  });
  const httpServer: HttpServerType = app.listen(PORT, () => {
    console.log(`server is running on ${PORT} 🚀`);
  });

  realTimeGateway.initializeIo(httpServer);

  console.log("Application bootstrapped successfully✌️");
};

export default bootstrap;

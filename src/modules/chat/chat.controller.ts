import { NextFunction, Request, Response, Router } from "express";
import { authentication } from "../../middleware";
import { successResponse } from "../../common/response";
import { chatService } from "./chat.service";
import { upload } from "../../common/utils/upload/multer.cloud";

const router = Router({ mergeParams: true });

router.get(
  "/",
  authentication(),
  async (req: Request, res: Response, _next: NextFunction) => {
    const chat = await chatService.getChat(
      req.params.userId as string,
      req.query as unknown as { page?: string; size?: string },
      req.user,
    );
    return successResponse({ res, data: { chat } });
  },
);
router.get(
  "/group/:groupId",
  authentication(),
  async (req: Request, res: Response, _next: NextFunction) => {
    const chat = await chatService.getGroupChat(
      req.params.groupId as string,
      req.query as unknown as { page?: string; size?: string },
      req.user,
    );
    return successResponse({ res, data: { chat } });
  },
);

router.get(
  "/group",
  authentication(),
  upload.any(),
  async (req: Request, res: Response, _next: NextFunction) => {
    const chat = await chatService.createGroup(
      req.body,
      req.user,
      req.file as Express.Multer.File,
    );
    return successResponse({ res, data: { chat } });
  },
);
export default router;

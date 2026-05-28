import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { authentication, validation } from "../../middleware";
import { successResponse } from "../../common/response";
import { upload } from "../../common/utils/upload/multer.cloud";
import * as validtors from "./comment.validation";
import { commentService } from "./comment.service";
import { CreateCommentParamsDto, CreateReplyOnCommentDto } from "./comment.dto";
import { IComment } from "../../common/interfaces";

const router = Router({ mergeParams: true });

router.post(
  "/",
  authentication(),
  upload.array("attachments", 2),
  validation(validtors.createComment),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await commentService.createComment({
        postId: req.params as CreateCommentParamsDto,
        data: { ...req.body, files: req.files as any },
        user: req.user!,
      });

      return successResponse<IComment>({
        res,
        status: 201,
        message: "Comment created successfully",
        data,
      });
    } catch (error) {
      return next(error);
      return next(error);
    }
  },
);

router.post(
  "/:commentId/reply",
  authentication(),
  upload.array("attachments", 2),
  validation(validtors.replyOnComment),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await commentService.replyOnComment({
        postId: req.params as CreateReplyOnCommentDto,
        data: { ...req.body, files: req.files as any },
        user: req.user!,
      });

      return successResponse<IComment>({
        res,
        status: 201,
        message: "Comment created successfully",
        data,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;

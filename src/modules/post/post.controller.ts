import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { authentication, validation } from "../../middleware";
import { successResponse } from "../../common/response";
import { upload } from "../../common/utils/upload/multer.cloud";
import * as validtors from "./post.validation";
import { postService } from "./post.service";
import {
  PagiateDto,
  paginationValidationSchema,
} from "../../common/validation";
import {
  ReactPostParamsDto,
  ReactPostQueryDto,
  updatePostBodyDto,
  updatePostParamsDto,
} from "./post.dto";

const router = Router();

router.get(
  "/",
  validation(paginationValidationSchema),
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.postList(
        { user: req.user! },
        req.query as PagiateDto,
      );

      return successResponse({
        res,
        status: 200,
        data: {
          message: "Posts fetched successfully",
          data,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/",
  authentication(),
  upload.array("attachments", 2),
  validation(validtors.createPost),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await postService.createPost({
        data: { ...req.body, files: req.files as any },
        user: req.user!,
      });

      return successResponse({
        res,
        status: 201,
        data: {
          message: "Post created successfully",
          data,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.patch(
  "/:postId/react",
  authentication(),
  validation(validtors.reactPost),
  async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.reactPost(
      req.params as ReactPostParamsDto,
      req.query as unknown as ReactPostQueryDto,
      req.user!,
    );
    return successResponse({ res, status: 200, data });
  },
);
router.patch(
  "/:postId",
  authentication(),
  upload.array("attachments", 2),
  validation(validtors.updatePost),
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response> => {
    const data = await postService.updatePost({
      postId: req.params as updatePostParamsDto,
      data: req.body as unknown as updatePostBodyDto,
      user: req.user!,
    });
    return successResponse({ res, status: 200, data });
  },
);
export default router;

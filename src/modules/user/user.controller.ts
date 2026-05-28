import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import userService from "./user.service";
import { successResponse } from "../../common/response";
import { authentication, authorization } from "../../middleware";
import { endPoint } from "./user.authrization";
import { TokenTypeEnum } from "../../common/enums";
import { UserModel } from "../../DB/model/user.model";
import { upload } from "../../common/utils/upload/multer.cloud";
import {
  uploadMultipleToCloudinary,
  uploadSingleToCloudinary,
} from "../../common/utils/upload/cloudinaryUpload.utils";
import { chatRouter } from "../chat";
import { BadRequestException } from "../../common/exceptions";

const router = Router();
router.use("/:userId/chat", chatRouter);

router.get(
  "/",
  authentication(),
  authorization(endPoint.profile),
  async (req: Request, res: Response, _next: NextFunction) => {
    const data = await userService.profile(req.user);
    return successResponse({ res, data });
  },
);

router.post("/logout", authentication(), async (req, res, _next) => {
  const status = await userService.logout(
    req.body,
    req.user!,
    req.decoded as { jti: string; iat: number; sub: string },
  );
  return successResponse({ res, status });
});

router.post(
  "/rotate-token",
  authentication(TokenTypeEnum.REFRESH),
  async (req, res, _next) => {
    const credentials = await userService.rotateToken(
      req.user!,
      req.decoded as { jti: string; iat: number; sub: string },
      `${req.protocol}://${req.headers.host}`,
    );
    return successResponse({ res, status: 201, data: { ...credentials } });
  },
);
router.patch(
  "/profile-picture",
  authentication(),
  upload.any(),
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const file = files && files.length > 0 ? files[0] : undefined;

      if (!file) {
        throw new BadRequestException("Image is required");
      }

      const userId = req.user!._id;
      const folderPath = `users/${userId.toString()}/profile-picture`;

      const secure_url = await uploadSingleToCloudinary(file, folderPath);

      await UserModel.updateOne({ _id: userId }, {
        profilePicture: secure_url,
      } as any);

      return successResponse({
        res,
        status: 201,
        data: { message: "Done Upload" },
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.patch(
  "/cover-picture",
  authentication(),
  upload.any(),
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        throw new BadRequestException("Images are required");
      }

      const userId = req.user!._id;
      const folderPath = `users/${userId.toString()}/cover-picture`;

      const secureUrls = await uploadMultipleToCloudinary(files, folderPath);

      await UserModel.updateOne({ _id: userId }, {
        profileCoverPicture: secureUrls,
      } as any);

      return successResponse({
        res,
        status: 201,
        data: { message: "Cover pictures updated successfully" },
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.delete("/profile-picture", authentication(), async (req, res, next) => {
  try {
    const userId = req.user!._id;

    await UserModel.updateOne({ _id: userId }, {
      $unset: { profilePicture: 1 },
    } as any);

    return successResponse({
      res,
      status: 200,
      data: { message: "Profile picture soft-deleted successfully" },
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/cover-picture", authentication(), async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      throw new BadRequestException(
        "Cover picture URL is required to delete it",
      );
    }

    const userId = req.user!._id;
    await UserModel.updateOne({ _id: userId }, {
      $pull: { profileCoverPicture: url },
    } as any);

    return successResponse({
      res,
      status: 200,
      data: { message: "Cover picture soft-deleted successfully" },
    });
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/:userId",
  authentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await userService.getProfileById(req.params.userId as string);
      return successResponse({ res, status: 200, data });
    } catch (error) {
      return next(error);
    }
  },
);

router.delete(
  "/",
  authentication(),
  authorization(endPoint.profile),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await userService.deleteProfile(req.user!);
      return successResponse({ res, data });
    } catch (error) {
      return next(error);
    }
  },
);
export default router;

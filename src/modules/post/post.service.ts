import {
  CreatePostBodyDto,
  ReactPostParamsDto,
  ReactPostQueryDto,
  updatePostBodyDto,
  updatePostParamsDto,
} from "./post.dto";
import { HydratedDocument, PopulateOptions, Types } from "mongoose";
import { IUser } from "./../../common/interfaces/user.interface";
import { PostRepository, UserRepository } from "../../DB/repository";
import {
  notificationService,
  NotificationService,
  redisService,
  RedisService,
} from "../../common/services";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/exceptions";
import { randomUUID } from "node:crypto";
import { uploadMultipleToCloudinary } from "../../common/utils/upload/cloudinaryUpload.utils";
import { IPaginate, IPost } from "../../common/interfaces";
import cloudinary from "../../DB/cloudinary/cloudinary.db";
import { getAvalibality } from "../../common/utils/post";
import { PagiateDto } from "../../common/validation";
import { realTimeGateway, RealtimeGateway } from "../realtime";

export class PostService {
  private populate: PopulateOptions[] = [
    { path: "likes" },
    { path: "createdBy" },
    { path: "tags" },
    { path: "updatedBy" },
    { path: "comments", populate: [{ path: "reply", populate: [{ path: "reply", }] }] }
]
  private readonly redis: RedisService;
  private readonly userRepository: UserRepository;
  private readonly postRepository: PostRepository;
  private readonly notification: NotificationService;
  private realTime :RealtimeGateway

  constructor() {
    this.realTime = realTimeGateway
    this.userRepository = new UserRepository();
    this.postRepository = new PostRepository();
    this.redis = redisService;
    this.notification = notificationService;
  }

  async postList(
    { user }: { user: HydratedDocument<IUser> },
    { page, search, size }: PagiateDto,
  ): Promise<IPaginate<IPost>> {
    const filter: any = {
      $or: getAvalibality(user),
    };

    if (search) {
      filter.content = { $regex: search, $options: "i" };
    }

    const posts = await this.postRepository.paginate({
      filter: {
        $or: getAvalibality(user),
        ...(search?.length
          ? { content: { $regex: search, $options: "i" } }
          : {}),
      },
      page,
      size,
      options:{
        populate:this.populate
      }
    });

    return posts;
  }

  async createPost({
    data: { availability, content, files, tags },
    user,
  }: {
    data: CreatePostBodyDto;
    user: HydratedDocument<IUser>;
  }): Promise<IPost> {
    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];
    if (tags?.length) {
      const mentionedAccounts = await this.userRepository.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (mentionedAccounts.length != tags.length) {
        throw new NotFoundException(
          "Fail to find some or all mentioned accounts",
        );
      }

      for (const tag of tags) {
        mentions.push(Types.ObjectId.createFromHexString(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) =>
          FCM_Tokens.push(token),
        );
      }
    }

    const folderId = randomUUID();
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await uploadMultipleToCloudinary(
        files as Express.Multer.File[],
        `posts/${folderId}`,
      );
    }

    const post = await this.postRepository.createOne({
      data: {
        content,
        availability,
        tags: mentions,
        attachments,
        folderId,
        createdBy: user._id,
      },
    });

    if (!post) {
      if (attachments.length) {
        try {
          await cloudinary.api.delete_resources_by_prefix(`posts/${folderId}/`);
          await cloudinary.api.delete_folder(`posts/${folderId}`);
        } catch (error) {
          console.error("Cloudinary Deletion Error:", error);
        }
      }
      throw new BadRequestException("Fail");
    }

    if (FCM_Tokens.length) {
      await this.notification.sendNotifications({
        tokens: FCM_Tokens,
        data: {
          title: "Post mention",
          body: JSON.stringify({
            message: `${user.username} mentioned you in his post`,
            postId: post.id,
          }),
        },
      });
    }

    return post.toJSON();
  }
  async reactPost(
    { postId }: ReactPostParamsDto,
    { react }: ReactPostQueryDto,
    user: HydratedDocument<IUser>,
  ): Promise<IPost> {
    const post = await this.postRepository.findOneAndUpdate({
      filter: {
        _id: postId,
        $or: getAvalibality(user),
      },
      update: {
        ...(Number(react) > 0
          ? { $addToSet: { likes: user._id } }
          : { $pull: { likes: user._id } }),
      },
      populate:this.populate
    });

    if (!post) {
      throw new NotFoundException("Fail to find matching post");
    }
const owner = post.createdBy as HydratedDocument<IUser>
    const socketIds = await this.redis.getSockets(owner._id)
    if (socketIds.length & Number(react) || 0 > 0) {
      this.realTime.getIo().to(socketIds).emit("likePost", {postId, userId:user._id, react})
    }
    return post.toJSON();
  }

  async updatePost({
    data: {
      availability,
      content,
      files = [],
      tags = [],
      removeFiles = [],
      removeTags = [],
    },
    user,
    postId: { postId },
  }: {
    data: updatePostBodyDto;
    user: HydratedDocument<IUser>;
    postId: updatePostParamsDto;
  }): Promise<IPost> {
    const post = await this.postRepository.findOne({
      filter: {
        _id: postId,
        createdBy: user._id,
      },
    });
    if (!post) {
      throw new NotFoundException("Fail to find matching post");
    }
    if (
      !post.content &&
      !content &&
      !files?.length &&
      post.attachments?.length == removeFiles.length
    ) {
      throw new BadRequestException("We cannot leave empty post");
    }

    const mentions: Types.ObjectId[] = [];
    const FCM_Tokens: string[] = [];
    if (tags?.length) {
      const mentionedAccounts = await this.userRepository.find({
        filter: {
          _id: { $in: tags },
        },
      });
      if (mentionedAccounts.length != tags.length) {
        throw new NotFoundException(
          "Fail to find some or all mentioned accounts",
        );
      }

      for (const tag of tags) {
        mentions.push(Types.ObjectId.createFromHexString(tag));
        ((await this.redis.getFCMs(tag)) || []).map((token) =>
          FCM_Tokens.push(token),
        );
      }
    }

    const folderId = post.folderId;
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await uploadMultipleToCloudinary(
        files as Express.Multer.File[],
        `posts/${folderId}`,
      );
    }

    const removeTagsIds = removeTags.map((tag) =>
      Types.ObjectId.createFromHexString(tag),
    );

    const updatePost = await this.postRepository.findOneAndUpdate({
      filter: {
        _id: postId,
        createdBy: user._id,
      },
      update: [
        {
          $set: {
            content: content || post.content,
            availability: Number(availability) || post.availability,
            updatedBy: user._id,
            attachments: {
              $setUnion: [
                {
                  $setDifference: [
                    { $ifNull: ["$attachments", []] },
                    removeFiles,
                  ],
                },
                attachments,
              ],
            },
            tags: {
              $setUnion: [
                {
                  $setDifference: [
                    { 
                      $ifNull: ["$tags", []] 
                    }, 
                    removeTagsIds]
                   },
                mentions,
              ],
            },
          },
        },
      ],
    });

    if (!updatePost) {
      if (attachments.length) {
        try {
          await cloudinary.api.delete_resources_by_prefix(`posts/${folderId}/`);
          await cloudinary.api.delete_folder(`posts/${folderId}`);
        } catch (error) {
          console.error("Cloudinary Deletion Error:", error);
        }
      }
      throw new BadRequestException("Fail");
    }

    if (removeFiles.length) {
      await cloudinary.api.delete_resources_by_prefix(`posts/${folderId}/`);
      await cloudinary.api.delete_folder(`posts/${folderId}`);
    }

    if (FCM_Tokens.length) {
      await this.notification.sendNotifications({
        tokens: FCM_Tokens,
        data: {
          title: "Post mention",
          body: JSON.stringify({
            message: `${user.username} mentioned you in his post`,
            postId: updatePost.id,
          }),
        },
      });
    }

    return updatePost.toJSON();
  }
}

export const postService = new PostService();

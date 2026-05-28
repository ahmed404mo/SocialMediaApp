import { CreateCommentBodyDto, CreateCommentParamsDto, CreateReplyOnCommentDto } from "./comment.dto";
import { HydratedDocument, Types } from "mongoose";
import { IUser } from "../../common/interfaces/user.interface";
import {
  CommentRepository,
  PostRepository,
  UserRepository,
} from "../../DB/repository";
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
import { uploadMultipleToCloudinary } from "../../common/utils/upload/cloudinaryUpload.utils";
import { IComment, IPost } from "../../common/interfaces";
import cloudinary from "../../DB/cloudinary/cloudinary.db";
import { getAvalibality } from "../../common/utils/post";

export class CommentService {
  private readonly redis: RedisService;
  private readonly commentRepository: CommentRepository;
  private readonly userRepository: UserRepository;
  private readonly postRepository: PostRepository;
  private readonly notification: NotificationService;

  constructor() {
    this.userRepository = new UserRepository();
    this.postRepository = new PostRepository();
    this.redis = redisService;
    this.commentRepository = new CommentRepository();
    this.notification = notificationService;
  }

  async replyOnComment({
    postId: { postId , commentId},
    data: { content, files, tags },
    user,
  }: {
    postId: CreateReplyOnCommentDto;
    data: CreateCommentBodyDto;
    user: HydratedDocument<IUser>;
  }): Promise<IComment> {
    const comment = await this.commentRepository.findOne({
      filter: {
        _id: commentId,
        postId:postId
      },
      options:{
        populate:[{
          path:"postId",
          match:{
        $or: getAvalibality(user),

          }
        }]
      }
    });
    if (!comment?.postId) {
      throw new NotFoundException("Fail to find matching comment");
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
const post = comment.postId as HydratedDocument<IPost>
    const folderId = post.folderId;
    let attachments: string[] = [];
    if (files?.length) {
      attachments = await uploadMultipleToCloudinary(
        files as Express.Multer.File[],
        `posts/${folderId}`,
      );
    }

    const reply = await this.commentRepository.createOne({
      data: {
        content,
        postId: post._id,
        tags: mentions,
        attachments,
        createdBy: user._id,
        commentId: comment._id,
      },
    });

    if (!reply) {
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
            message: `${user.username} mentioned you in his comment`,
            postId: comment.id,
            commentId: comment._id,
            replyId: reply._id,

          }),
        },
      });
    }

    return reply.toJSON();
  }

    async createComment({
    postId: { postId },
    data: { content, files, tags },
    user,
  }: {
    postId: CreateCommentParamsDto;
    data: CreateCommentBodyDto;
    user: HydratedDocument<IUser>;
  }): Promise<IComment> {
    const post = await this.postRepository.findOne({
      filter: {
        _id: postId,
        $or: getAvalibality(user),
      },
    });
    if (!post) {
      throw new NotFoundException("Fail to find matching post");
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

    const comment = await this.commentRepository.createOne({
      data: {
        content,
        postId: post._id,
        tags: mentions,
        attachments,
        createdBy: user._id,
      },
    });

    if (!comment) {
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
            message: `${user.username} mentioned you in his comment`,
            postId: comment.id,
            commentId: comment._id,
          }),
        },
      });
    }

    return comment.toJSON();
  }
}

export const commentService = new CommentService();

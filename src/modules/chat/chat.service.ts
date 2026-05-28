import { HydratedDocument } from "mongoose";
import { NotFoundException } from "../../common/exceptions";
import { toObjectId } from "../../common/utils/objectId";
import { ChatRepository } from "../../DB/repository/chat.repository";
import { IChat, IUser } from "../../common/interfaces";
import { ChatEnum } from "../../common/enums";
import { UserRepository } from "../../DB/repository";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";

export class ChatService {
  private chatRepository: ChatRepository;
  private userRepository: UserRepository;
  constructor() {
    this.chatRepository = new ChatRepository();
    this.userRepository = new UserRepository();
  }
  sayHi = () => {
    return "Done";
  };

  async getChat(
    participantId: string,
    { page, size }: { page?: string; size?: string },
    user: HydratedDocument<IUser>,
  ): Promise<IChat> {
    const chat = await this.chatRepository.findOneChat({
      filter: {
        participants: { $all: [user._id, toObjectId(participantId)] },
      },
      options: {
        populate: [{ path: "participants" }],
      },
      page,
      size,
    });
    if (!chat) {
      throw new NotFoundException("Fail to find Matching Conversation");
    }
    return chat.toJSON();
  }

  async sendMessage(
    { content, sendTo }: { content: string; sendTo: string },
    user: HydratedDocument<IUser>,
  ): Promise<void> {
    let chat = await this.chatRepository.findOneAndUpdate({
      filter: {
        participants: { $all: [user._id, toObjectId(sendTo)] },
        type: ChatEnum.ovo,
      },
      update: {
        $push: {
          messages: {
            content,
            createdBy: user._id,
          },
        },
      },
    });
    if (!chat) {
      chat = await this.chatRepository.createOne({
        data: {
          participants: [user._id, toObjectId(sendTo)],
          createdBy: user._id,
          type: ChatEnum.ovo,
          messages: [
            {
              content,
              createdBy: user._id,
            },
          ],
        },
      });
    }
  }

  async sendGroupMessage(
    { content, groupId }: { content: string; groupId: string },
    user: HydratedDocument<IUser>,
  ): Promise<string> {
    let chat = await this.chatRepository.findOneAndUpdate({
      filter: {
        _id: toObjectId(groupId),
        participants: { $in: [user._id] },
        type: ChatEnum.ovm,
      },
      update: {
        $push: {
          messages: {
            content,
            createdBy: user._id,
          },
        },
      },
    });
    if (!chat) {
      throw new NotFoundException("Fail to matching group");
    }

    return chat.roomId;
  }

  async createGroup(
    {
      participantsIds = [],
      group,
    }: { participantsIds: string[]; group: string },
    user: HydratedDocument<IUser>,
    file?: Express.Multer.File,
  ): Promise<IChat> {
    const participantObjectIds = [
      ...new Set(
        participantsIds.map((ele) => {
          return toObjectId(ele as string);
        }),
      ),
    ];
    const users = await this.userRepository.find({
      filter: {
        _id: { $in: participantObjectIds },
        friends: { $in: [user._id] },
      },
    });

    if (users.length != participantObjectIds.length) {
      throw new NotFoundException("Fail To Find participants");
    }
    const roomId = randomUUID();
    const path = `Chat/group/${roomId}`;
    let group_image: string | undefined;
    if (file) {
      const { secure_url } = await cloudinary.uploader.upload(file.path, {
        folder: path,
      });
      group_image = secure_url;
    }

    const chatingGroup = await this.chatRepository.createOne({
      data: {
        participants: [...participantObjectIds, user._id],
        createdBy: user._id,
        messages: [],
        type: ChatEnum.ovm,
        group,
        roomId,
        group_image,
      },
    });
    return chatingGroup.toJSON();
  }

  async getGroupChat(
    groupId: string,
    { page, size }: { page?: string; size?: string },
    user: HydratedDocument<IUser>,
  ): Promise<IChat> {
    const chat = await this.chatRepository.findOneChat({
      filter: {
        _id: toObjectId(groupId),
        participants: { $all: [user._id] },
        type: ChatEnum.ovm,
      },
      options: {
        populate: [{ path: "participants" }, {path:"messages.createdBy"}],
      },
      page,
      size,
    });
    if (!chat) {
      throw new NotFoundException("Fail to find Matching Conversation");
    }
    return chat.toJSON();
  }
}
export const chatService = new ChatService();

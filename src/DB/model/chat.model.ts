import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { IChat, IMessage } from "../../common/interfaces";
import { ChatEnum } from "../../common/enums";

const messageSchema = new Schema<IMessage>(
  {
    content: {
      type: String,
      required: function (this) {
        return !this.attachments?.length;
      },
    },
    attachments: { type: [String] },
    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],

    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
  },
);

const chatSchema = new Schema<IChat>(
  {
    participants: [{ type: Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ChatEnum, default: ChatEnum.ovo },

    //OVM
    group: {
      type: String,
      required: function (this) {
        return this.type == ChatEnum.ovm;
      },
    },
    roomId: {
      type: String,
      required: function (this) {
        return this.type == ChatEnum.ovm;
      },
    },
    group_image: {
      type: String,
    },
    //
    messages: { type: [messageSchema], required: true },

    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "SOCIAL_APP_CHATS",
  },
);

chatSchema.pre(["findOne", "find", "countDocuments"], function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    delete query.paranoid;
    this.setQuery({ ...query });
  } else {
    delete query.paranoid;
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

chatSchema.pre(["updateOne", "findOneAndUpdate"], function () {
  const update = this.getUpdate() as HydratedDocument<IChat>;
  if (update?.deletedAt) {
    this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
  }
  if (update?.restoredAt) {
    this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
    this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
  }
  const query = this.getQuery();
  if (query.paranoid === false) {
    delete query.paranoid;
    this.setQuery({ ...query });
  } else {
    delete query.paranoid;
    if (!query.deletedAt) {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
  }
});

chatSchema.pre(["deleteOne", "findOneAndDelete"], function () {
  const query = this.getQuery();
  if (query.force === true) {
    delete query.force;
    this.setQuery({ ...query });
  } else {
    delete query.force;
    this.setQuery({ deletedAt: { $exists: true }, ...query });
  }
});

export const ChatModel = models.Chat || model<IChat>("Chat", chatSchema);
ChatModel.syncIndexes();

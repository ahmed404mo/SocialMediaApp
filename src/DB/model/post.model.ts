import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { IPost } from "../../common/interfaces";
import { AvailabilityEnum } from "../../common/enums";

const postSchema = new Schema<IPost>(
  {
    folderId: { type: String, required: true },
    content: {
      type: String,
      required: function (this: any) {
        return !this.attachments?.length;
      },
    },
    attachments: { type: [String] },

    availability: {
      type: Number,
      enum: AvailabilityEnum,
      default: AvailabilityEnum.PUBLIC,
    },
    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],
    updatedBy: { type: Types.ObjectId, ref: "User" },
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
    collection: "SOCIAL_APP_POSTS",
  },
);

postSchema.pre(["findOne", "find", "countDocuments"], function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    delete query.paranoid;
    this.setQuery({ ...query });
  } else {
    delete query.paranoid;
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

postSchema.pre(["updateOne", "findOneAndUpdate"], function () {
  const update = this.getUpdate() as HydratedDocument<IPost>;
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

postSchema.pre(["deleteOne", "findOneAndDelete"], function () {
  const query = this.getQuery();
  if (query.force === true) {
    delete query.force;
    this.setQuery({ ...query });
  } else {
    delete query.force;
    this.setQuery({ deletedAt: { $exists: true }, ...query });
  }
});

postSchema.virtual("comments", {
  localField: "_id",
  foreignField: "postId",
  ref: "Comment",
  justOne: true,
});

export const PostModel = models.Post || model<IPost>("Post", postSchema);
PostModel.syncIndexes();

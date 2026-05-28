import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { IComment } from "../../common/interfaces";

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: function (this: any) {
        return !this.attachments?.length;
      },
    },
    attachments: { type: [String] },

    likes: [{ type: Types.ObjectId, ref: "User" }],
    tags: [{ type: Types.ObjectId, ref: "User" }],
    postId: [{ type: Types.ObjectId, ref: "Post", required: true }],
    commentId: [{ type: Types.ObjectId, ref: "comment" }],

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
    collection: "SOCIAL_APP_commentS",
  },
);

commentSchema.virtual("reply", {
  localField: "_id",
  foreignField: "commentId",
  ref: "Comment",
  justOne: true,
});

commentSchema.pre(["findOne", "find", "countDocuments"], function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    delete query.paranoid;
    this.setQuery({ ...query });
  } else {
    delete query.paranoid;
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

commentSchema.pre(["updateOne", "findOneAndUpdate"], function () {
  const update = this.getUpdate() as HydratedDocument<IComment>;
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

commentSchema.pre(["deleteOne", "findOneAndDelete"], function () {
  const query = this.getQuery();
  if (query.force === true) {
    delete query.force;
    this.setQuery({ ...query });
  } else {
    delete query.force;
    this.setQuery({ deletedAt: { $exists: true }, ...query });
  }
});

export const CommentModel =
  models.Comment || model<IComment>("Comment", commentSchema);
CommentModel.syncIndexes();

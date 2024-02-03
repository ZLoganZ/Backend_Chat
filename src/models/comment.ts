import { Schema, Types, model } from 'mongoose';

import { IUser } from '../types';
import { selectUserPopulate } from '../libs/constants';

const DOCUMENT_NAME = 'Comment';
const COLLECTION_NAME = 'comments';

const ObjectId = Schema.Types.ObjectId;

const CommentSchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: 'User',
      index: true,
      required: true
    },
    post: {
      type: ObjectId,
      ref: 'Post',
      index: true,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    likes: {
      type: [ObjectId],
      ref: 'User',
      default: []
    },
    replies: {
      type: [ObjectId],
      ref: 'Comment',
      default: []
    },
    isChild: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
    statics: {
      async getCommentsByPostID(postID: string | Types.ObjectId, page: string) {
        const limit = 5;
        const skip = parseInt(page) * limit;
        return await this.find({ post: postID, isChild: false })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate<{ user: IUser }>({
            path: 'user',
            select: selectUserPopulate
          })
          .populate<{ likes: IUser[] }>({
            path: 'likes',
            select: selectUserPopulate
          })
          .lean();
      },
      async getRepliesByCommentID(commentID: string | Types.ObjectId, page: string) {
        const limit = 5;
        const skip = parseInt(page) * limit;

        const comment = await this.findById(commentID);

        return await this.find({ _id: { $in: comment.replies }, isChild: true })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate<{ user: IUser }>({
            path: 'user',
            select: selectUserPopulate
          })
          .populate<{ likes: IUser[] }>({
            path: 'likes',
            select: selectUserPopulate
          })
          .lean();
      },
      async createComment(values: Record<string, any>) {
        return await (
          await this.create(values)
        ).populate<{ user: IUser }>({
          path: 'user',
          select: selectUserPopulate
        });
      },
      async deleteComment(id: string | Types.ObjectId) {
        return await this.findByIdAndDelete(id).lean();
      },
      async updateComment(id: string | Types.ObjectId, values: Record<string, any>) {
        return await this.findByIdAndUpdate(id, values, { new: true }).lean();
      },
      async likeComment(commentID: string | Types.ObjectId, userID: string | Types.ObjectId) {
        const comment = await this.findById(commentID);
        if (!comment) throw new Error('Comment not found');

        const isLiked = comment.likes.some((like) => like.toString() === userID || like === userID);

        if (isLiked) {
          await this.findByIdAndUpdate(commentID, { $pull: { likes: userID } });
        } else {
          await this.findByIdAndUpdate(commentID, { $push: { likes: userID } });
        }
        return { commentID, isLiked: !isLiked };
      }
    }
  }
);

export const CommentModel = model(DOCUMENT_NAME, CommentSchema);

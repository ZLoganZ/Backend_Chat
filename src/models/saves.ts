import { Schema, model, Types } from 'mongoose';

import { IUser } from '../types';
import { selectPostObj, selectUserPopulate, selectUserPopulateObj } from '../libs/constants';

const DOCUMENT_NAME = 'Save';
const COLLECTION_NAME = 'saves';

const ObjectId = Schema.Types.ObjectId;

const SaveSchema = new Schema(
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
      required: true
    }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
    statics: {
      async getSaveByID(id: string | Types.ObjectId) {
        return await this.findById(id)
          .populate<{ post: { creator: IUser; saves: { user: IUser[] }; likes: IUser[] } }>({
            path: 'post',
            populate: [
              {
                path: 'creator',
                select: selectUserPopulate
              },
              {
                path: 'saves',
                select: '-_id -__v -post',
                populate: [
                  {
                    path: 'user',
                    select: selectUserPopulate
                  }
                ]
              },
              {
                path: 'likes',
                select: selectUserPopulate
              }
            ]
          })
          .populate<{ user: IUser }>({
            path: 'user',
            select: selectUserPopulate
          })
          .lean();
      },
      async getSavedPostsByUserID(userID: string | Types.ObjectId, page: string) {
        const limit = 12;
        const skip = parseInt(page) * limit;

        const user = await model<IUser>('User').findById(userID).lean();

        return await this.aggregate([
          { $match: { user: user._id } },
          {
            $lookup: {
              from: 'posts',
              localField: 'post',
              foreignField: '_id',
              pipeline: [{ $project: selectPostObj }],
              as: 'post'
            }
          },
          { $unwind: '$post' },
          {
            $match: {
              $or: [
                { 'post.visibility': 'Public' },
                {
                  $and: [
                    { 'post.visibility': 'Followers' },
                    { $or: [{ 'post.creator': { $in: user.following } }, { 'post.creator': user._id }] }
                  ]
                },
                { $and: [{ 'post.visibility': 'Private' }, { 'post.creator': user._id }] }
              ]
            }
          },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'post.creator',
              foreignField: '_id',
              pipeline: [{ $project: selectUserPopulateObj }],
              as: 'post.creator'
            }
          },
          { $unwind: '$post.creator' },
          {
            $lookup: {
              from: 'saves',
              localField: 'post.saves',
              foreignField: '_id',
              pipeline: [
                {
                  $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    pipeline: [{ $project: selectUserPopulateObj }],
                    as: 'user'
                  }
                },
                { $unwind: '$user' },
                { $project: { user: 1, _id: 0 } }
              ],
              as: 'post.saves'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'post.likes',
              foreignField: '_id',
              pipeline: [{ $project: selectUserPopulateObj }],
              as: 'post.likes'
            }
          }
        ]);
      },
      async getSaveByPostIDAndUserID(postID: string | Types.ObjectId, userID: string | Types.ObjectId) {
        return await this.findOne({ post: postID, user: userID })
          .populate<{ post: { creator: IUser; saves: { user: IUser[] }; likes: IUser[] } }>({
            path: 'post',
            populate: [
              {
                path: 'creator',
                select: selectUserPopulate
              },
              {
                path: 'saves',
                select: '-_id -__v -post',
                populate: [
                  {
                    path: 'user',
                    select: selectUserPopulate
                  }
                ]
              },
              {
                path: 'likes',
                select: selectUserPopulate
              }
            ]
          })
          .populate<{ user: IUser }>({
            path: 'user',
            select: selectUserPopulate
          })
          .lean();
      },
      async createSave(values: Record<string, any>) {
        return await this.create(values);
      },
      async deleteSave(id: string | Types.ObjectId) {
        return await this.findByIdAndDelete(id).lean();
      },
      async deleteSaves(values: Record<string, any>) {
        return await this.deleteMany(values);
      },
      async updateSave(id: string | Types.ObjectId, values: Record<string, any>) {
        return await this.findByIdAndUpdate(id, values, { new: true }).lean();
      }
    }
  }
);

SaveSchema.index({ user: 1, post: 1 }, { unique: true });

export const SaveModel = model(DOCUMENT_NAME, SaveSchema);

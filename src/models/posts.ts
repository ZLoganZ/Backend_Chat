import { Schema, model, Types } from 'mongoose';

import { FILTERS, IPost, IUser } from '../types';
import { selectPostObj, selectUserPopulate, selectUserPopulateObj } from '../libs/constants';

const DOCUMENT_NAME = 'Post';
const COLLECTION_NAME = 'posts';

const ObjectId = Schema.Types.ObjectId;

const PostSchema = new Schema(
  {
    content: { type: String, required: true },
    creator: {
      type: ObjectId,
      ref: 'User',
      index: true,
      required: true
    },
    likes: {
      type: [ObjectId],
      ref: 'User',
      default: []
    },
    comments: {
      type: [ObjectId],
      ref: 'Comment',
      default: []
    },
    saves: {
      type: [ObjectId],
      ref: 'Save',
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    image: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
    statics: {
      async getPosts(page: string, sort: string = 'createdAt') {
        const limit = 12;
        const skip = parseInt(page) * limit;
        return await this.find()
          .sort({ [sort]: -1 })
          .skip(skip)
          .limit(limit)
          .populate<{ creator: IUser }>({
            path: 'creator',
            select: selectUserPopulate
          })
          .populate<{ likes: IUser[] }>({
            path: 'likes',
            select: selectUserPopulate
          })
          .populate<{ saves: { user: IUser[] } }>({
            path: 'saves',
            select: '-_id -__v -post',
            populate: {
              path: 'user',
              select: selectUserPopulate
            }
          })
          .select('-__v -updatedAt')
          .lean();
      },
      async getTopPosts(page: string, filter: FILTERS = 'All') {
        const limit = 12;
        const skip = parseInt(page) * limit;

        return await this.aggregate<IPost>([
          {
            $project: {
              ...selectPostObj,
              likesCount: { $size: '$likes' },
              savesCount: { $size: '$saves' }
            }
          },
          { $sort: { likesCount: -1, savesCount: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'creator',
              foreignField: '_id',
              pipeline: [{ $project: selectUserPopulateObj }],
              as: 'creator'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'likes',
              foreignField: '_id',
              pipeline: [{ $project: selectUserPopulateObj }],
              as: 'likes'
            }
          },
          {
            $lookup: {
              from: 'saves',
              localField: 'saves',
              foreignField: '_id',
              as: 'saves',
              pipeline: [
                { $project: { _id: 0, user: 1 } },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    pipeline: [{ $project: selectUserPopulateObj }],
                    as: 'user'
                  }
                }
              ]
            }
          },
          { $unwind: '$creator' },
          { $project: selectPostObj }
        ]);
      },
      async getPostByID(id: string | Types.ObjectId) {
        return await this.findById(id)
          .populate<{ creator: IUser }>({
            path: 'creator',
            select: selectUserPopulate
          })
          .populate<{ likes: IUser[] }>({
            path: 'likes',
            select: selectUserPopulate
          })
          .populate<{ saves: { user: IUser[] } }>({
            path: 'saves',
            select: '-_id -__v -post',
            populate: {
              path: 'user',
              select: selectUserPopulate
            }
          })
          .select('-__v -updatedAt')
          .lean();
      },
      async createPost(values: Record<string, any>) {
        const post = await (
          await this.create(values)
        ).populate<{ creator: IUser }>({ path: 'creator', select: selectUserPopulate });

        return post;
      },
      async deletePost(id: string | Types.ObjectId) {
        const post = await this.findByIdAndDelete(id).lean();

        return post;
      },
      async updatePost(id: string | Types.ObjectId, values: Record<string, any>) {
        return await this.findByIdAndUpdate(id, values, { new: true }).lean();
      },
      async searchPosts(page: string, query: string, filter: FILTERS = 'All') {
        const limit = 12;
        const skip = parseInt(page) * limit;

        return await this.find({ $text: { $search: query } })
          .sort({ score: { $meta: 'textScore' } })
          .skip(skip)
          .limit(limit)
          .populate<{ creator: IUser }>({
            path: 'creator',
            select: selectUserPopulate
          })
          .populate<{ likes: IUser[] }>({
            path: 'likes',
            select: selectUserPopulate
          })
          .populate<{ saves: { user: IUser[] } }>({
            path: 'saves',
            select: '-_id -__v -post',
            populate: {
              path: 'user',
              select: selectUserPopulate
            }
          })
          .select('-__v -updatedAt')
          .lean();
      },
      async getPostsByUserID(userID: string | Types.ObjectId, page: string, sort: string = 'createdAt') {
        const limit = 12;
        const skip = parseInt(page) * limit;
        return await this.find({ creator: userID })
          .sort({ [sort]: -1 })
          .skip(skip)
          .limit(limit)
          .populate<{ creator: IUser }>({
            path: 'creator',
            select: selectUserPopulate
          })
          .populate<{ likes: IUser[] }>({
            path: 'likes',
            select: selectUserPopulate
          })
          .populate<{ saves: { user: IUser[] } }>({
            path: 'saves',
            select: '-_id -__v -post',
            populate: {
              path: 'user',
              select: selectUserPopulate
            }
          })
          .select('-__v -updatedAt')
          .lean();
      },
      async getLikedPostsByUserID(userID: string | Types.ObjectId, page: string, sort: string = 'createdAt') {
        const limit = 12;
        const skip = parseInt(page) * limit;

        return await this.find({ likes: { $in: userID } })
          .sort({ [sort]: -1 })
          .skip(skip)
          .limit(limit)
          .populate<{ creator: IUser }>({
            path: 'creator',
            select: selectUserPopulate
          })
          .populate<{ likes: IUser[] }>({
            path: 'likes',
            select: selectUserPopulate
          })
          .populate<{ saves: { user: IUser[] } }>({
            path: 'saves',
            select: '-_id -__v -post',
            populate: {
              path: 'user',
              select: selectUserPopulate
            }
          })
          .select('-__v -updatedAt')
          .lean();
      },
      async getRelatedPostsByPostID(postID: string | Types.ObjectId) {
        const post = await this.findById(postID).lean();

        return await this.aggregate<IPost>([
          {
            $match: {
              $or: [{ tags: { $in: post.tags } }, { location: { $regex: post.location, $options: 'i' } }],
              _id: { $ne: new Types.ObjectId(postID) }
            }
          },
          { $addFields: { sharedTags: { $setIntersection: ['$tags', post.tags] } } },
          { $addFields: { sharedTagsCount: { $size: '$sharedTags' } } },
          { $sort: { sharedTagsCount: -1 } },
          { $limit: 3 },
          {
            $lookup: {
              from: 'users',
              localField: 'creator',
              foreignField: '_id',
              pipeline: [{ $project: selectUserPopulateObj }],
              as: 'creator'
            }
          },
          { $unwind: '$creator' },
          {
            $lookup: {
              from: 'users',
              localField: 'likes',
              foreignField: '_id',
              pipeline: [{ $project: selectUserPopulateObj }],
              as: 'likes'
            }
          },
          {
            $lookup: {
              from: 'saves',
              localField: 'saves',
              foreignField: '_id',
              as: 'saves',
              pipeline: [
                { $project: { _id: 0, user: 1 } },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    pipeline: [{ $project: selectUserPopulateObj }],
                    as: 'user'
                  }
                }
              ]
            }
          },
          { $project: { __v: 0, updatedAt: 0, sharedTags: 0, sharedTagsCount: 0 } }
        ]);
      }
    }
  }
);

PostSchema.index({ content: 'text', tags: 'text', location: 'text' });

export const PostModel = model(DOCUMENT_NAME, PostSchema);

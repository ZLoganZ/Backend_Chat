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
    visibility: {
      type: String,
      enum: ['Public', 'Private', 'Followers'],
      default: 'Public'
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
      async getPosts(userID: string | Types.ObjectId, page: string, sort: string = 'createdAt') {
        const limit = 12;
        const skip = parseInt(page) * limit;

        const user = await model<IUser>('User').findById(userID).lean();

        return await this.aggregate([
          {
            $match: {
              $or: [
                { visibility: 'Public' },
                {
                  $and: [
                    { visibility: 'Followers' },
                    { $or: [{ creator: { $in: user.following } }, { creator: user._id }] }
                  ]
                },
                { $and: [{ visibility: 'Private' }, { creator: user._id }] }
              ]
            }
          },
          { $sort: { [sort]: -1 } },
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
                },
                { $unwind: '$user' }
              ],
              as: 'saves'
            }
          },
          {
            $addFields: {
              likesCount: { $size: '$likes' }
            }
          },
          { $project: selectPostObj }
        ]);
      },
      async getTopPosts(userID: string | Types.ObjectId, page: string, filter: FILTERS = 'All') {
        const limit = 12;
        const skip = parseInt(page) * limit;

        const user = await model<IUser>('User').findById(userID).lean();

        return await this.aggregate<IPost>([
          {
            $match: {
              $or: [
                { visibility: 'Public' },
                {
                  $and: [
                    { visibility: 'Followers' },
                    { $or: [{ creator: { $in: user.following } }, { creator: user._id }] }
                  ]
                },
                { $and: [{ visibility: 'Private' }, { creator: user._id }] }
              ]
            }
          },
          { $addFields: { likesCount: { $size: '$likes' } } },
          { $addFields: { savesCount: { $size: '$saves' } } },
          { $sort: { likesCount: -1, savesCount: -1, createdAt: -1 } },
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
                },
                { $unwind: '$user' }
              ]
            }
          },
          { $project: selectPostObj }
        ]);
      },
      async getPostByID(id: string | Types.ObjectId, userID: string | Types.ObjectId) {
        const user = await model<IUser>('User').findById(userID).lean();

        return await this.aggregate<IPost>([
          { $match: { _id: new Types.ObjectId(id) } },
          {
            $match: {
              $or: [
                { visibility: 'Public' },
                {
                  $and: [
                    { visibility: 'Followers' },
                    { $or: [{ creator: { $in: user.following } }, { creator: user._id }] }
                  ]
                },
                { $and: [{ visibility: 'Private' }, { creator: user._id }] }
              ]
            }
          },
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
                },
                { $unwind: '$user' }
              ]
            }
          },
          { $project: selectPostObj }
        ]).then((posts) => posts[0]);
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
      async searchPosts(
        userID: string | Types.ObjectId,
        page: string,
        query: string,
        filter: FILTERS = 'All'
      ) {
        const limit = 12;
        const skip = parseInt(page) * limit;

        const user = await model<IUser>('User').findById(userID).lean();

        return await this.aggregate([
          { $match: { $text: { $search: `\"${query}\"` } } },
          {
            $match: {
              $or: [
                { visibility: 'Public' },
                {
                  $and: [
                    { visibility: 'Followers' },
                    { $or: [{ creator: { $in: user.following } }, { creator: user._id }] }
                  ]
                },
                { $and: [{ visibility: 'Private' }, { creator: user._id }] }
              ]
            }
          },
          { $sort: { score: { $meta: 'textScore' }, createdAt: -1 } },
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
                },
                { $unwind: '$user' }
              ],
              as: 'saves'
            }
          },
          {
            $addFields: {
              likesCount: { $size: '$likes' }
            }
          },
          { $project: selectPostObj }
        ]);
      },
      async getPostsByUserID(
        userID: string | Types.ObjectId,
        curUserID: string,
        page: string,
        sort: string = 'createdAt'
      ) {
        const limit = 12;
        const skip = parseInt(page) * limit;

        const user = await model<IUser>('User').findById(curUserID).lean();

        return await this.aggregate([
          { $match: { creator: userID } },
          {
            $match: {
              $or: [
                { visibility: 'Public' },
                {
                  $and: [
                    { visibility: 'Followers' },
                    { $or: [{ creator: { $in: user.following } }, { creator: user._id }] }
                  ]
                },
                { $and: [{ visibility: 'Private' }, { creator: user._id }] }
              ]
            }
          },
          { $sort: { [sort]: -1 } },
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
                },
                { $unwind: '$user' }
              ],
              as: 'saves'
            }
          },
          {
            $addFields: {
              likesCount: { $size: '$likes' }
            }
          },
          { $project: selectPostObj }
        ]);
      },
      async getLikedPostsByUserID(userID: string | Types.ObjectId, page: string, sort: string = 'createdAt') {
        const limit = 12;
        const skip = parseInt(page) * limit;

        const user = await model<IUser>('User').findById(userID).lean();

        return await this.aggregate([
          { $match: { likes: new Types.ObjectId(userID) } },
          {
            $match: {
              $or: [
                { visibility: 'Public' },
                {
                  $and: [
                    { visibility: 'Followers' },
                    { $or: [{ creator: { $in: user.following } }, { creator: user._id }] }
                  ]
                },
                { $and: [{ visibility: 'Private' }, { creator: user._id }] }
              ]
            }
          },
          { $sort: { [sort]: -1 } },
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
                },
                { $unwind: '$user' }
              ],
              as: 'saves'
            }
          },
          {
            $addFields: {
              likesCount: { $size: '$likes' }
            }
          },
          { $project: selectPostObj }
        ]);
      },
      async getRelatedPostsByPostID(postID: string | Types.ObjectId, userID: string | Types.ObjectId) {
        const post = await this.findById(postID).lean();

        const user = await model<IUser>('User').findById(userID).lean();

        return await this.aggregate<IPost>([
          {
            $match: {
              $or: [{ tags: { $in: post.tags } }, { location: { $regex: post.location, $options: 'i' } }],
              _id: { $ne: new Types.ObjectId(postID) }
            }
          },
          {
            $match: {
              $or: [
                { visibility: 'Public' },
                {
                  $and: [
                    { visibility: 'Followers' },
                    { $or: [{ creator: { $in: user.following } }, { creator: user._id }] }
                  ]
                },
                { $and: [{ visibility: 'Private' }, { creator: user._id }] }
              ]
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
                },
                { $unwind: '$user' }
              ]
            }
          },
          { $project: selectPostObj }
        ]);
      }
    }
  }
);

PostSchema.index({ content: 'text', tags: 'text', location: 'text' });

export const PostModel = model(DOCUMENT_NAME, PostSchema);

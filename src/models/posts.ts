import { Schema, model, Types } from 'mongoose';
import { selectUser } from 'utils/constants';

const DOCUMENT_NAME = 'Post';
const COLLECTION_NAME = 'posts';

const PostSchema = new Schema(
  {
    content: { type: String, required: true },
    creator: {
      type: Types.ObjectId,
      ref: 'User',
      index: true,
      required: true
    },
    likes: {
      type: [Types.ObjectId],
      ref: 'User',
      default: []
    },
    saves: {
      type: [Types.ObjectId],
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
    collection: COLLECTION_NAME
  }
);

PostSchema.index({ content: 'text', tags: 'text', location: 'text' });

const PostModel = model(DOCUMENT_NAME, PostSchema);

class Post {
  static async getPosts(page: string, sort = 'createdAt') {
    const limit = 12;
    const skip = parseInt(page) * limit;
    return await PostModel.find()
      .populate({
        path: 'creator',
        select: selectUser
      })
      .populate({
        path: 'likes',
        select: selectUser
      })
      .populate({
        path: 'saves',
        populate: [
          {
            path: 'user',
            select: selectUser
          }
        ]
      })
      .select('-__v -updatedAt')
      .skip(skip)
      .limit(limit)
      .sort({ [sort]: -1 })
      .lean();
  }
  static async getPostByID(id: string) {
    return await PostModel.findById(id)
      .populate({
        path: 'creator',
        select: selectUser
      })
      .populate({
        path: 'likes',
        select: selectUser
      })
      .populate({
        path: 'saves',
        populate: [
          {
            path: 'user',
            select: selectUser
          }
        ]
      })
      .select('-__v -updatedAt')
      .lean();
  }
  static async createPost(values: Record<string, any>) {
    return await (
      await PostModel.create(values)
    ).populate({
      path: 'creator',
      select: selectUser
    });
  }
  static async deletePost(id: string) {
    return await PostModel.findByIdAndDelete(id).lean();
  }
  static async updatePost(id: string, values: Record<string, any>) {
    return await PostModel.findByIdAndUpdate(id, values, { new: true }).lean();
  }
  static async likePost(id: string, userID: string) {
    return await PostModel.findByIdAndUpdate(id, { $push: { likes: userID } }, { new: true }).lean();
  }
  static async savePost(id: string, userID: string) {
    return await PostModel.findByIdAndUpdate(id, { $push: { saves: userID } }, { new: true }).lean();
  }
  static async unlikePost(id: string, userID: string) {
    return await PostModel.findByIdAndUpdate(id, { $pull: { likes: userID } }, { new: true }).lean();
  }
  static async unsavePost(id: string, userID: string) {
    return await PostModel.findByIdAndUpdate(id, { $pull: { saves: userID } }, { new: true }).lean();
  }
  static async searchPosts(query: string) {
    return await PostModel.find({ $text: { $search: query } })
      .populate({
        path: 'creator',
        select: selectUser
      })
      .populate({
        path: 'likes',
        select: selectUser
      })
      .populate({
        path: 'saves',
        populate: [
          {
            path: 'user',
            select: selectUser
          }
        ]
      })
      .select('-__v -updatedAt')
      .lean();
  }
  static async getPostsByUserID(userID: string, page: string, sort = 'createdAt') {
    const limit = 12;
    const skip = parseInt(page) * limit;
    return await PostModel.find({ creator: userID })
      .populate({
        path: 'creator',
        select: selectUser
      })
      .populate({
        path: 'likes',
        select: selectUser
      })
      .populate({
        path: 'saves',
        populate: [
          {
            path: 'user',
            select: selectUser
          }
        ]
      })
      .select('-__v -updatedAt')
      .skip(skip)
      .limit(limit)
      .sort({ [sort]: -1 })
      .lean();
  }
  static async getLikedPostsByUserID(userID: string, page: string, sort = 'createdAt') {
    const limit = 12;
    const skip = parseInt(page) * limit;
    return await PostModel.find({ likes: { $in: userID } })
      .populate({
        path: 'creator',
        select: selectUser
      })
      .populate({
        path: 'likes',
        select: selectUser
      })
      .populate({
        path: 'saves',
        populate: [
          {
            path: 'user',
            select: selectUser
          }
        ]
      })
      .select('-__v -updatedAt')
      .skip(skip)
      .limit(limit)
      .sort({ [sort]: -1 })
      .lean();
  }
}

export default Post;

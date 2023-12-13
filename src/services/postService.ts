import crypto from 'crypto';
import { UploadApiResponse } from 'cloudinary';
import { Types } from 'mongoose';

import { PostModel } from '../models/posts';
import { SaveModel } from '../models/saves';
import { UserModel } from '../models/users';
import { BadRequest } from '../cores/error.response';
import { FILTERS, INewPost, IUpdatePost } from '../types';
import imageHandler from '../helpers/image';
import { removeUndefinedFields, strToArr, updateNestedObject } from '../libs/utils';

class PostService {
  static async createPost(payload: INewPost) {
    if (!payload.content) throw new BadRequest('Content is required');
    if (!payload.creator) throw new BadRequest('Creator is required');
    if (!payload.image) throw new BadRequest('Image is required');

    const tags = strToArr(payload.tags);

    const uploadedImage: UploadApiResponse = await new Promise((resolve) => {
      imageHandler
        .unsigned_upload_stream(
          process.env.CLOUDINARY_PRESET,
          {
            folder: 'instafram/posts',
            public_id: payload.image.originalname + '_' + crypto.randomBytes(8).toString('hex')
          },
          (error, result) => {
            if (error) throw new BadRequest(error.message);
            resolve(result);
          }
        )
        .end(payload.image.buffer);
    });

    const post = await PostModel.createPost({ ...payload, image: uploadedImage.public_id, tags });

    await UserModel.updateUser(payload.creator, { $push: { posts: post._id } });

    return post;
  }
  static async updatePost(payload: IUpdatePost) {
    if (!payload.content) throw new BadRequest('Content is required');
    if (!payload.postID) throw new BadRequest('PostModel ID is required');

    let image: string | undefined;
    const tags = strToArr(payload.tags);

    if (payload.isChangeImage && payload.image) {
      const [uploadedImage, post] = await Promise.all([
        new Promise<UploadApiResponse>((resolve) => {
          imageHandler
            .unsigned_upload_stream(
              process.env.CLOUDINARY_PRESET,
              {
                folder: 'instafram/posts',
                public_id: payload.image.originalname + '_' + crypto.randomBytes(8).toString('hex')
              },
              (error, result) => {
                if (error) throw new BadRequest(error.message);
                resolve(result as UploadApiResponse);
              }
            )
            .end(payload.image.buffer);
        }),
        PostModel.getPostByID(payload.postID)
      ]);

      if (!post) throw new BadRequest('PostModel not found');

      imageHandler.destroy(post.image);

      image = uploadedImage.public_id;
    }

    delete payload.image;
    return await PostModel.updatePost(
      payload.postID,
      updateNestedObject(removeUndefinedFields({ ...payload, tags, image }))
    );
  }
  static async deletePost(postID: string) {
    const post = await PostModel.deletePost(postID);

    await UserModel.updateUser(post.creator, { $pull: { posts: postID } });
    post.image && imageHandler.destroy(post.image);
    post.saves && SaveModel.deleteSaves({ post: postID });

    return post;
  }
  static async getPosts(page: string) {
    return await PostModel.getPosts(page);
  }
  static async getPost(postID: string) {
    return await PostModel.getPostByID(postID);
  }
  static async likePost(payload: { postID: string; userID: string }) {
    const { postID, userID } = payload;

    const post = await PostModel.getPostByID(postID);
    if (!post) throw new BadRequest('PostModel not found');

    const isLiked = post.likes.some((like) => like._id.toString() === userID);

    if (isLiked) {
      await PostModel.updatePost(postID, { $pull: { likes: userID } });
    } else {
      await PostModel.updatePost(postID, { $push: { likes: userID } });
    }
    return { postID, isLiked: !isLiked };
  }
  static async savePost(payload: { postID: string; userID: string }) {
    const { postID, userID } = payload;

    const saved = await SaveModel.getSaveByPostIDAndUserID(postID, userID);
    if (saved) {
      await PostModel.updatePost(postID, { $pull: { saves: saved._id } });
      await SaveModel.deleteSave(saved._id.toString());
    } else {
      const saved = await SaveModel.createSave({ post: postID, user: userID });
      await PostModel.updatePost(postID, { $push: { saves: saved.id } });
    }
    return { postID, saved: !saved };
  }
  static async searchPosts(payload: { page: string; query: string; filter: FILTERS }) {
    const { query, filter = 'All', page } = payload;

    return await PostModel.searchPosts(page, query, filter);
  }
  static async getPostsByUserID(payload: { userID: string; page: string }) {
    const { userID, page } = payload;

    if (Types.ObjectId.isValid(userID)) {
      return await PostModel.getPostsByUserID(userID, page);
    } else {
      const user = await UserModel.getUserByAlias(userID);
      if (!user) throw new BadRequest('UserModel not found');

      return await PostModel.getPostsByUserID(user._id, page);
    }
  }
  static async getSavedPostsByUserID(payload: { userID: string; page: string }) {
    const { userID, page } = payload;

    if (Types.ObjectId.isValid(userID)) {
      return (await SaveModel.getSavedPostsByUserID(userID, page)).map((savedPost) => savedPost.post);
    } else {
      const user = await UserModel.getUserByAlias(userID);
      if (!user) throw new BadRequest('UserModel not found');

      return (await SaveModel.getSavedPostsByUserID(user._id, page)).map((savedPost) => savedPost.post);
    }
  }
  static async getLikedPostsByUserID(payload: { userID: string; page: string }) {
    const { userID, page } = payload;

    if (Types.ObjectId.isValid(userID)) {
      return await PostModel.getLikedPostsByUserID(userID, page);
    } else {
      const user = await UserModel.getUserByAlias(userID);
      if (!user) throw new BadRequest('UserModel not found');

      return await PostModel.getLikedPostsByUserID(user._id, page);
    }
  }
  static async getTopPosts(payload: { page: string; filter: FILTERS }) {
    const { page, filter = 'All' } = payload;

    return await PostModel.getTopPosts(page, filter);
  }
  static async getRelatedPostsByPostID(postID: string) {
    return await PostModel.getRelatedPostsByPostID(postID);
  }
}

export default PostService;

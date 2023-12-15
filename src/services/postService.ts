import crypto from 'crypto';
import { UploadApiResponse } from 'cloudinary';
import { Types } from 'mongoose';

import { PostModel } from '../models/posts';
import { SaveModel } from '../models/saves';
import { UserModel } from '../models/users';
import { BadRequest } from '../cores/error.response';
import { FILTERS, INewPost, IUpdatePost } from '../types';
import imageHandler from '../helpers/image';
import { randomCacheTime, removeUndefinedFields, strToArr, updateNestedObject } from '../libs/utils';
import { redis } from '../libs/redis';
import { REDIS_CACHE } from '../libs/constants';

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

    redis.set(REDIS_CACHE.POST + post._id, JSON.stringify(post), 'EX', randomCacheTime());

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
    const post = await PostModel.updatePost(
      payload.postID,
      updateNestedObject(removeUndefinedFields({ ...payload, tags, image }))
    );

    redis.get(REDIS_CACHE.POST + payload.postID, (error, result) => {
      if (error) throw new BadRequest(error.message);
      if (result) {
        redis.set(REDIS_CACHE.POST + payload.postID, JSON.stringify(post));
      } else {
        redis.set(REDIS_CACHE.POST + payload.postID, JSON.stringify(post), 'EX', randomCacheTime());
      }
    });

    return post;
  }
  static async deletePost(postID: string) {
    const post = await PostModel.deletePost(postID);

    await UserModel.updateUser(post.creator, { $pull: { posts: postID } });
    post.image && imageHandler.destroy(post.image);
    post.saves && SaveModel.deleteSaves({ post: postID });

    redis.del(REDIS_CACHE.POST + postID);

    return post;
  }
  static async getPosts(page: string) {
    const cache = await redis.get(REDIS_CACHE.POSTS + page);
    if (cache) return JSON.parse(cache);

    const posts = await PostModel.getPosts(page);

    redis.set(REDIS_CACHE.POSTS + page, JSON.stringify(posts), 'EX', randomCacheTime());

    return posts;
  }
  static async getPost(postID: string) {
    const cache = await redis.get(REDIS_CACHE.POST + postID);
    if (cache) return JSON.parse(cache);

    const post = await PostModel.getPostByID(postID);

    if (!post) throw new BadRequest('Post not found');

    redis.set(REDIS_CACHE.POST + postID, JSON.stringify(post), 'EX', randomCacheTime());

    return post;
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

    const cache = await redis.get(REDIS_CACHE.POSTS + userID + page);
    if (cache) return JSON.parse(cache);

    if (Types.ObjectId.isValid(userID)) {
      const posts = await PostModel.getPostsByUserID(userID, page);

      redis.set(REDIS_CACHE.POSTS + userID + page, JSON.stringify(posts), 'EX', randomCacheTime());

      return posts;
    } else {
      const user = await UserModel.getUserByAlias(userID);
      if (!user) throw new BadRequest('UserModel not found');

      const posts = await PostModel.getPostsByUserID(user._id, page);

      redis.set(REDIS_CACHE.POSTS + userID + page, JSON.stringify(posts), 'EX', randomCacheTime());

      return posts;
    }
  }
  static async getSavedPostsByUserID(payload: { userID: string; page: string }) {
    const { userID, page } = payload;

    const cache = await redis.get(REDIS_CACHE.SAVED_POSTS + userID + page);
    if (cache) return JSON.parse(cache);

    const posts = (await SaveModel.getSavedPostsByUserID(userID, page)).map((savedPost) => savedPost.post);

    redis.set(REDIS_CACHE.SAVED_POSTS + userID + page, JSON.stringify(posts), 'EX', randomCacheTime());

    return posts;
  }
  static async getLikedPostsByUserID(payload: { userID: string; page: string }) {
    const { userID, page } = payload;

    const cache = await redis.get(REDIS_CACHE.LIKED_POSTS + userID + page);
    if (cache) return JSON.parse(cache);

    const posts = await PostModel.getLikedPostsByUserID(userID, page);

    redis.set(REDIS_CACHE.LIKED_POSTS + userID + page, JSON.stringify(posts), 'EX', randomCacheTime());

    return posts;
  }
  static async getTopPosts(payload: { page: string; filter: FILTERS }) {
    const { page, filter = 'All' } = payload;

    const cache = await redis.get(REDIS_CACHE.TOP_POSTS + page + filter);
    if (cache) return JSON.parse(cache);

    const posts = await PostModel.getTopPosts(page, filter);

    redis.set(REDIS_CACHE.TOP_POSTS + page + filter, JSON.stringify(posts), 'EX', randomCacheTime());

    return posts;
  }
  static async getRelatedPostsByPostID(postID: string) {
    const cache = await redis.get(REDIS_CACHE.RELATED_POSTS + postID);
    if (cache) return JSON.parse(cache);

    const posts = await PostModel.getRelatedPostsByPostID(postID);

    redis.set(REDIS_CACHE.RELATED_POSTS + postID, JSON.stringify(posts), 'EX', randomCacheTime());

    return posts;
  }
}

export default PostService;

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
    if (!payload.tags) throw new BadRequest('Tags is required');
    if (!payload.visibility) throw new BadRequest('Visibility is required');

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

    // await redis.call('JSON.SET', `${REDIS_CACHE.POST}-${post._id}`, '$', JSON.stringify(post));
    // await redis.expire(`${REDIS_CACHE.POST}-${post._id}`, randomCacheTime());

    return post;
  }
  static async updatePost(payload: { userID: string; updateData: IUpdatePost }) {
    const { userID, updateData } = payload;
    if (!updateData.content) throw new BadRequest('Content is required');
    if (!updateData.postID) throw new BadRequest('PostModel ID is required');

    let image: string | undefined;
    const tags = strToArr(updateData.tags);

    if (updateData.isChangeImage && updateData.image) {
      const [uploadedImage, post] = await Promise.all([
        new Promise<UploadApiResponse>((resolve) => {
          imageHandler
            .unsigned_upload_stream(
              process.env.CLOUDINARY_PRESET,
              {
                folder: 'instafram/posts',
                public_id: updateData.image.originalname + '_' + crypto.randomBytes(8).toString('hex')
              },
              (error, result) => {
                if (error) throw new BadRequest(error.message);
                resolve(result as UploadApiResponse);
              }
            )
            .end(updateData.image.buffer);
        }),
        PostModel.getPostByID(updateData.postID, userID)
      ]);

      if (!post) throw new BadRequest('PostModel not found');

      imageHandler.destroy(post.image);

      image = uploadedImage.public_id;
    }

    // await redis.call('JSON.DEL', `${REDIS_CACHE.POST}-${payload.postID}`);

    delete updateData.image;
    return await PostModel.updatePost(
      updateData.postID,
      updateNestedObject(removeUndefinedFields({ ...updateData, tags, image }))
    );
  }
  static async deletePost(postID: string) {
    const post = await PostModel.deletePost(postID);

    await UserModel.updateUser(post.creator, { $pull: { posts: postID } });
    post.image && imageHandler.destroy(post.image);
    post.saves && SaveModel.deleteSaves({ post: postID });

    // redis.call('JSON.DEL', `${REDIS_CACHE.POST}-${postID}`);

    return post;
  }
  static async getPosts(payload: { userID: string; page: string }) {
    const { userID, page } = payload;
    // const cache = (await redis.call('JSON.GET', `${REDIS_CACHE.POSTS}-P${page}`)) as string;
    // if (cache) return JSON.parse(cache);

    const posts = await PostModel.getPosts(userID, page);

    // await redis.call('JSON.SET', `${REDIS_CACHE.POSTS}-P${page}`, '$', JSON.stringify(posts));
    // await redis.expire(`${REDIS_CACHE.POSTS}-P${page}`, randomCacheTime());

    return posts;
  }
  static async getPost(payload: { postID: string; userID: string }) {
    const { postID, userID } = payload;
    // const cache = (await redis.call('JSON.GET', `${REDIS_CACHE.POST}-${postID}`)) as string;
    // if (cache) return JSON.parse(cache);

    const post = await PostModel.getPostByID(postID, userID);

    if (!post) throw new BadRequest('Post not found');

    // await redis.call('JSON.SET', `${REDIS_CACHE.POST}-${postID}`, '$', JSON.stringify(post));
    // await redis.expire(`${REDIS_CACHE.POST}-${postID}`, randomCacheTime());

    return post;
  }
  static async likePost(payload: { postID: string; userID: string }) {
    const { postID, userID } = payload;

    const post = await PostModel.getPostByID(postID, userID);
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
  static async searchPosts(payload: { userID: string; page: string; query: string; filter: FILTERS }) {
    const { userID, query, filter = 'All', page } = payload;

    return await PostModel.searchPosts(userID, page, query, filter);
  }
  static async getPostsByUserID(payload: { userID: string; page: string; curUserID: string }) {
    const { userID, curUserID, page } = payload;

    // const cache = (await redis.call('JSON.GET', `${REDIS_CACHE.POSTS}-${userID}-P${page}`)) as string;
    // if (cache) return JSON.parse(cache);

    if (Types.ObjectId.isValid(userID)) {
      const posts = await PostModel.getPostsByUserID(userID, curUserID, page);

      // await redis.call('JSON.SET', `${REDIS_CACHE.POSTS}-${userID}-P${page}`, '$', JSON.stringify(posts));
      // await redis.expire(`${REDIS_CACHE.POSTS}-${userID}-P${page}`, randomCacheTime());

      return posts;
    } else {
      const user = await UserModel.getUserByAlias(userID);
      if (!user) throw new BadRequest('UserModel not found');

      const posts = await PostModel.getPostsByUserID(user._id, curUserID, page);

      // await redis.call('JSON.SET', `${REDIS_CACHE.POSTS}-${userID}-P${page}`, '$', JSON.stringify(posts));
      // await redis.expire(`${REDIS_CACHE.POSTS}-${userID}-P${page}`, randomCacheTime());

      return posts;
    }
  }
  static async getSavedPostsByUserID(payload: { userID: string; page: string }) {
    const { userID, page } = payload;

    // const cache = (await redis.call('JSON.GET', `${REDIS_CACHE.SAVED_POSTS}-${userID}-P${page}`)) as string;
    // if (cache) return JSON.parse(cache);

    const posts = (await SaveModel.getSavedPostsByUserID(userID, page)).map((savedPost) => savedPost.post);

    // await redis.call('JSON.SET', `${REDIS_CACHE.SAVED_POSTS}-${userID}-P${page}`, '$', JSON.stringify(posts));
    // await redis.expire(`${REDIS_CACHE.SAVED_POSTS}-${userID}-P${page}`, randomCacheTime());

    return posts;
  }
  static async getLikedPostsByUserID(payload: { userID: string; page: string }) {
    const { userID, page } = payload;

    // const cache = (await redis.call('JSON.GET', `${REDIS_CACHE.LIKED_POSTS}-${userID}-P${page}`)) as string;
    // if (cache) return JSON.parse(cache);

    const posts = await PostModel.getLikedPostsByUserID(userID, page);

    // await redis.call('JSON.SET', `${REDIS_CACHE.LIKED_POSTS}-${userID}-P${page}`, '$', JSON.stringify(posts));
    // await redis.expire(`${REDIS_CACHE.LIKED_POSTS}-${userID}-P${page}`, randomCacheTime());

    return posts;
  }
  static async getTopPosts(payload: { userID: string; page: string; filter: FILTERS }) {
    const { userID, page, filter = 'All' } = payload;

    // const cache = (await redis.call('JSON.GET', `${REDIS_CACHE.TOP_POSTS}-P${page}-${filter}`)) as string;
    // if (cache) return JSON.parse(cache);

    const posts = await PostModel.getTopPosts(userID, page, filter);

    // await redis.call('JSON.SET', `${REDIS_CACHE.TOP_POSTS}-P${page}-${filter}`, '$', JSON.stringify(posts));
    // await redis.expire(`${REDIS_CACHE.TOP_POSTS}-P${page}-${filter}`, randomCacheTime());

    return posts;
  }
  static async getRelatedPostsByPostID(payload: { postID: string; userID: string }) {
    const { postID, userID } = payload;
    // const cache = (await redis.call('JSON.GET', `${REDIS_CACHE.RELATED_POSTS}-${postID}`)) as string;
    // if (cache) return JSON.parse(cache);

    const posts = await PostModel.getRelatedPostsByPostID(postID, userID);

    // await redis.call('JSON.SET', `${REDIS_CACHE.RELATED_POSTS}-${postID}`, '$', JSON.stringify(posts));
    // await redis.expire(`${REDIS_CACHE.RELATED_POSTS}-${postID}`, randomCacheTime());

    return posts;
  }
}

export default PostService;

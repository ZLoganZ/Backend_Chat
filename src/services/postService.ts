import crypto from 'crypto';
import { UploadApiResponse } from 'cloudinary';

import Post from 'models/posts';
import Save from 'models/saves';
import { BadRequest } from 'cores/error.response';
import { INewPost, IUpdatePost } from 'types';
import imageHandler from 'helpers/image';
import { strToArr } from 'utils';
import User from 'models/users';

class PostService {
  static async createPost(payload: INewPost) {
    if (!payload.content) throw new BadRequest('Content is required');
    if (!payload.creator) throw new BadRequest('Creator is required');
    if (!payload.image) throw new BadRequest('Image is required');

    let tags: string[] = [];

    if (payload.tags) {
      tags = strToArr(payload.tags);
    }

    const uploadedImage: UploadApiResponse = await new Promise((resolve) => {
      imageHandler
        .unsigned_upload_stream(
          process.env.CLOUDINARY_PRESET as string,
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

    const post = await Post.createPost({ ...payload, image: uploadedImage.public_id, tags });

    await User.updateUser(payload.creator, { $push: { posts: post._id } });

    return post;
  }
  static async updatePost(payload: IUpdatePost) {
    if (!payload.content) throw new BadRequest('Content is required');
    if (!payload.postID) throw new BadRequest('Post ID is required');

    let tags: string[] = [];
    let image: string | undefined;

    if (payload.tags) {
      tags = strToArr(payload.tags);
    }

    if (payload.isChangeImage && payload.image) {
      const uploadedImage: UploadApiResponse = await new Promise((resolve) => {
        imageHandler
          .unsigned_upload_stream(
            process.env.CLOUDINARY_PRESET as string,
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

      const post = await Post.getPostByID(payload.postID);

      if (!post) throw new BadRequest('Post not found');

      imageHandler.destroy(post.image);

      image = uploadedImage.public_id;
    }

    delete payload.image;
    return await Post.updatePost(payload.postID, { ...payload, tags, image });
  }
  static async deletePost(postID: string) {
    const post = await Post.deletePost(postID);

    await User.updateUser(post.creator as string, { $pull: { posts: postID } });
    post.image && imageHandler.destroy(post.image);
    post.saves && Save.deleteMany({ post: postID });

    return post;
  }
  static async getPosts(page: string) {
    return await Post.getPosts(page);
  }
  static async getPost(postID: string) {
    return await Post.getPostByID(postID);
  }
  static async likePost(postID: string, userID: string) {
    const post = await Post.getPostByID(postID);
    if (!post) throw new BadRequest('Post not found');

    const isLiked = post.likes.some((like: any) => like._id.toString() === userID);

    if (isLiked) {
      await Post.unlikePost(postID, userID);
    } else {
      await Post.likePost(postID, userID);
    }
    return { postID, isLiked: !isLiked };
  }
  static async savePost(postID: string, userID: string) {
    const saved = await Save.getSaveByPostIDAndUserID(postID, userID);
    if (saved) {
      await Post.updatePost(postID, { $pull: { saves: saved._id } });
      await Save.deleteSave(saved._id.toString());
    } else {
      const saved = await Save.createSave({ post: postID, user: userID });
      await Post.updatePost(postID, { $push: { saves: saved.id } });
    }
    return { postID, saved: !saved };
  }
  static async searchPosts(query: string) {
    return await Post.searchPosts(query);
  }
  static async getPostsByUserID(userID: string, page: string) {
    return await Post.getPostsByUserID(userID, page);
  }
  static async getSavedPostsByUserID(userID: string, page: string) {
    const savedPosts = await Save.getSaveByUserID(userID, page);
    const posts = savedPosts.map((savedPost) => savedPost.post);
    return posts;
  }
  static async getLikedPostsByUserID(userID: string, page: string) {
    return await Post.getLikedPostsByUserID(userID, page);
  }
}

export default PostService;

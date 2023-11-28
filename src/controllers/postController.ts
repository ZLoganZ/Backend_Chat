import { Response, NextFunction } from 'express';

import { Ok, Created, Accepted } from 'cores/success.response';
import PostService from 'services/postService';
import { RequestWithUser } from 'types';

class AuthController {
  static async createPost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Created(
      'Create post successfully',
      await PostService.createPost({ ...req.body, creator: req.user._id, image: req.file })
    ).send(res);
  }
  static async updatePost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Update post successfully', await PostService.updatePost({ ...req.body, image: req.file })).send(
      res
    );
  }
  static async deletePost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Accepted('Delete post successfully', await PostService.deletePost(req.params.postID)).send(res);
  }
  static async getPosts(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Get posts successfully', await PostService.getPosts(req.query.page.toString())).send(res);
  }
  static async getPost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Get post successfully', await PostService.getPost(req.params.postID)).send(res);
  }
  static async likePost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Like post successfully', await PostService.likePost(req.params.postID, req.user._id)).send(res);
  }
  static async savePost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Save post successfully', await PostService.savePost(req.params.postID, req.user._id)).send(res);
  }
  static async searchPosts(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Search post successfully', await PostService.searchPosts(req.query.search.toString())).send(res);
  }
  static async getPostsByUserID(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get posts by user id successfully',
      await PostService.getPostsByUserID(req.params.userID, req.query.page.toString())
    ).send(res);
  }
  static async getSavedPostsByUserID(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get posts saved by user id successfully',
      await PostService.getSavedPostsByUserID(req.params.userID, req.query.page.toString())
    ).send(res);
  }
  static async getLikedPostsByUserID(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get posts liked by user id successfully',
      await PostService.getLikedPostsByUserID(req.params.userID, req.query.page.toString())
    ).send(res);
  }
}

export default AuthController;

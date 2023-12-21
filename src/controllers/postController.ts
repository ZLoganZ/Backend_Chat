import { Response, NextFunction } from 'express';

import { Ok, Created, Accepted } from '../cores/success.response';
import PostService from '../services/postService';
import { FILTERS, RequestWithUser } from '../types';

class AuthController {
  static async createPost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Created(
      'Create post successfully',
      await PostService.createPost({ ...req.body, creator: req.user._id, image: req.file })
    ).send(res);
  }
  static async updatePost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Update post successfully',
      await PostService.updatePost({
        userID: req.user._id,
        updateData: { ...req.body, image: req.file }
      })
    ).send(res);
  }
  static async deletePost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Accepted('Delete post successfully', await PostService.deletePost(req.params.postID)).send(res);
  }
  static async getPosts(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get posts successfully',
      await PostService.getPosts({ userID: req.user._id, page: req.query.page.toString() })
    ).send(res);
  }
  static async getPost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get post successfully',
      await PostService.getPost({
        userID: req.user._id,
        postID: req.params.postID
      })
    ).send(res);
  }
  static async likePost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Like post successfully',
      await PostService.likePost({ postID: req.params.postID, userID: req.user._id })
    ).send(res);
  }
  static async savePost(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Save post successfully',
      await PostService.savePost({ postID: req.params.postID, userID: req.user._id })
    ).send(res);
  }
  static async searchPosts(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Search post successfully',
      await PostService.searchPosts({
        userID: req.user._id,
        page: req.query.page.toString(),
        query: req.query.search.toString(),
        filter: req.query.filter.toString() as FILTERS
      })
    ).send(res);
  }
  static async getPostsByUserID(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get posts by user id successfully',
      await PostService.getPostsByUserID({ userID: req.params.userID, page: req.query.page.toString() })
    ).send(res);
  }
  static async getSavedPostsByUserID(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get posts saved by user id successfully',
      await PostService.getSavedPostsByUserID({ userID: req.params.userID, page: req.query.page.toString() })
    ).send(res);
  }
  static async getLikedPostsByUserID(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get posts liked by user id successfully',
      await PostService.getLikedPostsByUserID({ userID: req.params.userID, page: req.query.page.toString() })
    ).send(res);
  }
  static async getTopPosts(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get top posts successfully',
      await PostService.getTopPosts({
        userID: req.user._id,
        page: req.query.page.toString(),
        filter: req.query.filter.toString() as FILTERS
      })
    ).send(res);
  }
  static async getRelatedPostsByPostID(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get related posts successfully',
      await PostService.getRelatedPostsByPostID({
        userID: req.user._id,
        postID: req.params.postID
      })
    ).send(res);
  }
}

export default AuthController;

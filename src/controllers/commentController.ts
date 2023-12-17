import { Response, NextFunction } from 'express';

import { Ok, Created, Accepted } from '../cores/success.response';
import CommentService from '../services/commentService';
import { RequestWithUser } from '../types';

class CommentController {
  static async createComment(req: RequestWithUser, res: Response, _: NextFunction) {
    new Created(
      'Create comment successfully',
      await CommentService.createComment({ ...req.body, user: req.user._id })
    ).send(res);
  }
  static async deleteComment(req: RequestWithUser, res: Response, _: NextFunction) {
    new Accepted(
      'Delete comment successfully',
      await CommentService.deleteComment(req.params.commentID)
    ).send(res);
  }
  static async getCommentsByPostID(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get comments by post id successfully',
      await CommentService.getCommentsByPostID({ postID: req.params.postID, page: req.query.page.toString() })
    ).send(res);
  }
  static async getRepliesByCommentID(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get replies by comment id successfully',
      await CommentService.getRepliesByCommentID({
        commentID: req.params.commentID,
        page: req.query.page.toString()
      })
    ).send(res);
  }
  static async likeComment(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Like comment successfully',
      await CommentService.likeComment({ commentID: req.params.commentID, userID: req.user._id })
    ).send(res);
  }
  static async updateComment(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Update comment successfully',
      await CommentService.updateComment({ commentID: req.body.replyTo, content: req.body.content })
    ).send(res);
  }
}

export default CommentController;

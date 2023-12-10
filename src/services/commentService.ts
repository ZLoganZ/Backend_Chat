import { CommentModel } from '../models/comment';
import { PostModel } from '../models/posts';
import { BadRequest } from '../cores/error.response';

class CommentService {
  static async createComment(payload: { content: string; user: string; post: string; replyTo?: string }) {
    const { content, user, post, replyTo } = payload;

    if (!content) throw new BadRequest('Content is required');
    if (!user) throw new BadRequest('Creator is required');
    if (!post) throw new BadRequest('Post ID is required');

    const postFind = await PostModel.getPostByID(post);

    if (!postFind) throw new BadRequest('Post is not exist');

    const comment = await CommentModel.createComment(payload);

    if (replyTo) {
      await CommentModel.updateComment(replyTo, { $push: { replies: comment._id } });
    }

    await PostModel.updatePost(post, { $push: { comments: comment._id } });

    return comment;
  }
  static async deleteComment(commentID: string) {
    if (!commentID) throw new BadRequest('Comment ID is required');

    return await CommentModel.deleteComment(commentID);
  }
  static async getCommentsByPostID(payload: { postID: string; page: string }) {
    const { postID, page } = payload;

    if (!postID) throw new BadRequest('Post ID is required');

    return await CommentModel.getCommentsByPostID(postID, page);
  }
  static async getRepliesByCommentID(payload: { commentID: string; page: string }) {
    const { commentID, page } = payload;

    if (!commentID) throw new BadRequest('Comment ID is required');

    return await CommentModel.getRepliesByCommentID(commentID, page);
  }
}

export default CommentService;

import { Router } from 'express';

import { asyncHandler } from 'utils';

import PostController from 'controllers/postController';
import { upload } from 'middlewares';

const router = Router();

router.get('/', asyncHandler(PostController.getPosts));
router.get('/user/:userID', asyncHandler(PostController.getPostsByUserID));
router.get('/search', asyncHandler(PostController.searchPosts));
router.get('/top', asyncHandler(PostController.getTopPosts));
router.get('/saved/:userID', asyncHandler(PostController.getSavedPostsByUserID));
router.get('/liked/:userID', asyncHandler(PostController.getLikedPostsByUserID));
router.get('/:postID', asyncHandler(PostController.getPost));
router.get('/:postID/related', asyncHandler(PostController.getRelatedPostsByPostID));
router.post('/', upload.single('image'), asyncHandler(PostController.createPost));
router.post('/:postID/like', asyncHandler(PostController.likePost));
router.post('/:postID/save', asyncHandler(PostController.savePost));
router.put('/:postID', upload.single('image'), asyncHandler(PostController.updatePost));
router.delete('/:postID', asyncHandler(PostController.deletePost));

export default router;

import { Router } from 'express';

import { upload } from '../middlewares';
import { asyncHandler } from '../libs/utils';
import UserController from '../controllers/userController';

const router = Router();

router.get('/top-creators', asyncHandler(UserController.getTopCreators));
router.get('/:userIDorAlias', asyncHandler(UserController.getUser));
router.post('/:userID/follow', asyncHandler(UserController.followUser));
router.put('/edit', upload.single('image'), asyncHandler(UserController.updateUser));

export default router;

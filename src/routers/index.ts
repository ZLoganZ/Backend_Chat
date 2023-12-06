import { Router } from 'express';

import authRouter from './authRouter';
import postRouter from './postRouter';
import userRouter from './userRouter';
import commentRouter from './commentRouter';
import { Authentication } from 'middlewares';

const router = Router();

router.use('/auth', authRouter);
router.use(Authentication);
router.use('/users', userRouter);
router.use('/posts', postRouter);
router.use('/comments', commentRouter);

export default router;

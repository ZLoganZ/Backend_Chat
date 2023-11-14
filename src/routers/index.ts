import { Router } from 'express';

import authRouter from './authRouter';

const router = Router();

export default () => {
  authRouter(router);

  return router;
};

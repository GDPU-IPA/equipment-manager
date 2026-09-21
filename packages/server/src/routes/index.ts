import { Router } from 'express';
import categoryRouter from './category.js';
import borrowRouter from './borrow.js';

export const apiRouter: Router = Router();

apiRouter.use('/categories', categoryRouter);
apiRouter.use('/borrows', borrowRouter);

export default apiRouter;
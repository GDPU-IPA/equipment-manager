import { Router } from 'express';
import categoryRouter from './category.js';
import borrowRouter from './borrow.js';
import equipmentRouter from './equipment.js';
import userRouter from './user.js';

export const apiRouter: Router = Router();

apiRouter.use('/categories', categoryRouter);
apiRouter.use('/borrows', borrowRouter);
apiRouter.use('/equipments', equipmentRouter);
apiRouter.use('/users', userRouter);

export default apiRouter;
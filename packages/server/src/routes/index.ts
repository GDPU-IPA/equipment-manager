import { Router } from 'express';
import categoryRouter from './category.js';
import borrowRouter from './borrow.js';
import equipmentRouter from './equipment.js';

export const apiRouter: Router = Router();

apiRouter.use('/categories', categoryRouter);
apiRouter.use('/borrows', borrowRouter);
apiRouter.use('/equipments', equipmentRouter);

export default apiRouter;
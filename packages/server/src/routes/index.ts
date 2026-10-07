import { Router } from 'express';
import categoryRouter from './category.js';
import borrowRouter from './borrow.js';
import equipmentRouter from './equipment.js';
import userRouter, { registerUser } from './user.js';
import sessionRouter, { logoutCurrentSession } from './session.js';
import returnRecordRouter from './return-record.js';
import { requireAuth } from '../auth/require-auth.js';

export const apiRouter: Router = Router();

apiRouter.use('/session', sessionRouter);
apiRouter.post('/users', registerUser);
apiRouter.use(requireAuth);
apiRouter.post('/sessions/current', logoutCurrentSession);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/borrows', borrowRouter);
apiRouter.use('/return-records', returnRecordRouter);
apiRouter.use('/equipments', equipmentRouter);
apiRouter.use('/users', userRouter);

export default apiRouter;
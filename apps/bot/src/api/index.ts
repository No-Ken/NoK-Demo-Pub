import express from 'express';
import scheduleRouter from './v1/schedules.routes';
import warikanRouter from './v1/warikan.routes';
import personalMemoRouter from './v1/personalMemos.routes';
import sharedMemoRouter from './v1/sharedMemos.routes';
import authRouter from '../routers/auth';

const api = express.Router();

api.use('/auth', authRouter);

const v1Router = express.Router();
v1Router.use('/warikan', warikanRouter);
v1Router.use('/schedules', scheduleRouter);
v1Router.use('/personal-memos', personalMemoRouter);
v1Router.use('/shared-memos', sharedMemoRouter);

api.use('/v1', v1Router);

export default api;
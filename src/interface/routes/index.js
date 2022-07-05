import { Router } from 'express';
import productRouter from './productsRouter.js';
import orderRoutes from './orderRoutes.js';
import artistRoutes from './artistRoutes.js';
import eventRoutes from './eventRoutes.js';
import usersRouter from './usersRouter.js';
import UserController from '../controllers/userController.js';
import userService from '../../application/userService.js';

const router = new Router();

router.use('/users', usersRouter(new UserController(userService)));
router.use('/artists', artistRoutes);
router.use('/products', productRouter);
router.use('/orders', orderRoutes);
router.use('/events', eventRoutes);

export default router;

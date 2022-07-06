import { Router } from 'express';
import orderRoutes from './orderRoutes.js';
import artistRoutes from './artistRoutes.js';
import eventRoutes from './eventRoutes.js';
import usersRouter from './usersRouter.js';
import productsRouter from './productsRouter.js';
import UserController from '../controllers/userController.js';
import userService from '../../application/userService.js';
import ProductController from '../controllers/productController.js';
import { productService } from '../../application/productService.js';

const router = new Router();

router.use('/users', usersRouter(new UserController(userService)));
router.use('/products', productsRouter(new ProductController(productService)));
router.use('/artists', artistRoutes);
router.use('/orders', orderRoutes);
router.use('/events', eventRoutes);

export default router;

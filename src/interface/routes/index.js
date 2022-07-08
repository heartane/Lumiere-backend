import { Router } from 'express';
import orderRoutes from './orderRoutes.js';
import artistRoutes from './artistRoutes.js';
import eventRoutes from './eventRoutes.js';
import usersRouter from './usersRouter.js';
import productsRouter from './productsRouter.js';
import UserController from '../controllers/userController.js';
import UserService from '../../application/userService.js';
import ProductController from '../controllers/productController.js';
import ProductService from '../../application/productService.js';

const router = new Router();

export default function apiRouter(serviceLocator) {
  const { logger } = serviceLocator;

  router.use(
    '/users',
    usersRouter(
      new UserController(
        new UserService(serviceLocator.userRepository, logger),
      ),
    ),
  );
  router.use(
    '/products',
    productsRouter(
      new ProductController(
        new ProductService(
          serviceLocator.productRepository,
          serviceLocator.artistRepository,
          logger,
        ),
      ),
    ),
  );
  router.use('/artists', artistRoutes);
  router.use('/orders', orderRoutes);
  router.use('/events', eventRoutes);

  return router;
}

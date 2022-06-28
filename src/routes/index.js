import { Router } from 'express';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import artistRoutes from './artistRoutes.js';
import eventRoutes from './eventRoutes.js';

const router = new Router();

router.use('/artists', artistRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/events', eventRoutes);

export default router;

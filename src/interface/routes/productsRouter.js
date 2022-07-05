import express from 'express';

import {
  getProductById,
  getLatestProducts,
  zzimProduct,
  getZzimProducts,
  getCartItems,
  getTotalPrice,
  ProductController,
} from '../controllers/productController.js';
import { protect, admin } from '../../infrastructure/setup/middlewares/auth.js';
import * as validate from '../helper/validate.js';
import { productService } from '../../application/productService.js';

const router = express.Router();

// ⛳️ 임시! 추후 수정
const productController = new ProductController(productService);

// endpoint => /api/products
router
  .route('/')
  .get(validate.getProductsInput, productController.getProducts)
  .post(
    protect,
    admin,
    validate.createProductInput,
    productController.createProduct,
  );

router.route('/latest').get(getLatestProducts);
router.route('/total-price').get(protect, getTotalPrice);
router.route('/cart-items').get(getCartItems);
router.route('/zzim').patch(protect, zzimProduct).get(protect, getZzimProducts);
router
  .route('/:id')
  .get(getProductById)
  .patch(
    protect,
    admin,
    validate.updateProductInput,
    productController.updateProduct,
  )
  .delete(protect, admin, validate.productId, productController.deleteProduct);

export default router;

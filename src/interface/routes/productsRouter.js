import express from 'express';
import { protect, admin } from '../../infrastructure/setup/middlewares/auth.js';
import * as validate from '../helper/validate.js';

const router = express.Router();

// endpoint => /api/products
export default function productsRouter(productController) {
  router
    .route('/')
    .get(validate.getProductsInput, productController.getProducts)
    .post(
      protect,
      admin,
      validate.createProductInput,
      productController.createProduct,
    );

  router
    .route('/latest') //
    .get(productController.getLatestProducts);

  router
    .route('/total-price') //
    .get(protect, productController.getTotalPrice);

  router
    .route('/cart-items') //
    .get(productController.getCartItems);

  router
    .route('/zzim')
    .patch(protect, validate.zzimInput, productController.zzimProduct)
    .get(protect, productController.getZzimProducts);

  router
    .route('/:id')
    .get(
      validate.productIdForLocation('param'),
      productController.getProductById,
    )
    .patch(
      protect,
      admin,
      validate.updateProductInput,
      productController.updateProduct,
    )
    .delete(
      protect,
      admin,
      validate.productIdForLocation('param'),
      productController.deleteProduct,
    );

  return router;
}

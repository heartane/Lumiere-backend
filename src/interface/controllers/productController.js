/* eslint-disable no-underscore-dangle */
import asyncHandler from 'express-async-handler';
import isAuthorized from '../../utils/isAuthorized.js';
import { HTTP_STATUS } from '../../infrastructure/config/constants.js';
import { serializePagination } from '../helper/serializer.js';

export default class ProductController {
  #productService;

  constructor(productService) {
    this.#productService = productService;
  }

  // @desc   Create a product
  // @route  POST /api/products
  // @access Private/Admin
  createProduct = asyncHandler(async (req, res) => {
    const data = await this.#productService.createProduct(req.body);

    res.status(HTTP_STATUS.CREATE).json(data);
  });

  // @desc   Fetch all products
  // @route  GET /api/products
  // @access Public
  getProducts = asyncHandler(async (req, res) => {
    const { pageNumber, isAdmin, ...searchQuery } = req.query;
    const page = Number(pageNumber) || 1;
    let data;

    if (isAdmin === 'true') {
      req.user = isAuthorized(req);
      if (!req.user?.isAdmin) {
        return res
          .status(HTTP_STATUS.UNAUTHORIZED)
          .json('Not authorized, token failed');
      }
      // 관리자의 상품관리페이지
      data = await this.#productService.getProducts(page, true);
    } else {
      data = await this.#productService.getProducts(page, false, searchQuery);
    }

    const { products, count, pageSize } = data;
    return res
      .status(HTTP_STATUS.OK)
      .json(serializePagination({ products }, page, count, pageSize));
  });

  // @desc    Update a product
  // @route   PATCH /api/products/:id
  // @access  Private/Admin
  updateProduct = asyncHandler(async (req, res) => {
    const data = await this.#productService.updateProduct(
      req.params.id,
      req.body,
    );

    res.status(HTTP_STATUS.OK).json(data);
  });

  // @desc    Delete a product
  // @route   DELETE /api/products/:id
  // @access  Private/Admin
  deleteProduct = asyncHandler(async (req, res) => {
    // 재고 있을 시에만 삭제 가능

    const deleted = await this.#productService.deleteProduct(req.params.id);

    const message = deleted
      ? `해당 상품이 삭제되었습니다`
      : '해당 상품은 삭제할 수 없습니다';

    res.status(HTTP_STATUS.OK).json(message);
  });

  // @desc   Fetch single product
  // @route  GET /api/products/:id
  // @access Public
  getProductById = asyncHandler(async (req, res) => {
    const data = await this.#productService.getProductById(req.params.id);

    if (!data) {
      return res.status(HTTP_STATUS.NOT_FOUND).json('ProductId not exist');
    }
    return res.status(HTTP_STATUS.OK).json(data);
  });

  // @desc   Fetch latest products
  // @route  GET /api/products/latest
  // @access Public
  getLatestProducts = asyncHandler(async (req, res) => {
    const data = await this.#productService.getLatestProducts();

    if (!data.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json('Products not exist');
    }
    return res.status(HTTP_STATUS.OK).json(data);
  });

  // @desc   Check stock of cartItems
  // @route  GET /api/products/cart-items
  // @access Public
  getCartItems = asyncHandler(async (req, res) => {
    // 장바구니 상품 재고 확인 차 요청
    const { productId: productIdArray } = req.query;

    const data = productIdArray
      ? await this.#productService.getCartItems(productIdArray)
      : [];

    res.status(HTTP_STATUS.OK).json(data);
  });

  // @desc   Fetch cartItems totalprice
  // @route  GET /api/products/total-price
  // @access Private
  getTotalPrice = asyncHandler(async (req, res) => {
    // 결제로 넘어갈 시 총 상품 금액
    const { productId: productIdArray } = req.query;

    const data = await this.#productService.getTotalPrice(productIdArray);

    res.status(HTTP_STATUS.OK).json(data);
  });

  // @desc   Zzim or unZzim the product
  // @route  PATCH /api/products/zzim
  // @access Private
  zzimProduct = asyncHandler(async (req, res) => {
    const { productId, zzim } = req.body;

    const data = await this.#productService.zzimProduct(
      productId,
      req.user.id,
      zzim,
    );

    if (data && zzim) {
      return res.status(HTTP_STATUS.OK).json('해당 상품 찜 완료');
    }
    return res.status(HTTP_STATUS.OK).json('해당 상품 찜 해제');
  });

  // @desc   Fetch products in zzimlist
  // @route  GET /api/products/zzim
  // @access Private
  getZzimProducts = asyncHandler(async (req, res) => {
    const data = await this.#productService.getZzimProducts(req.user.id);

    res.status(HTTP_STATUS.OK).json(data);
  });
}

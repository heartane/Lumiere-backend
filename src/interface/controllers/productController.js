/* eslint-disable no-underscore-dangle */
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Product from '../../infrastructure/database/mongoose/models/product.js';
import isAuthorized from '../../utils/isAuthorized.js';
import { HTTP_STATUS } from '../../infrastructure/config/constants.js';

const { ObjectId } = mongoose.Types;

export class ProductController {
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
      if (req.user?.isAdmin) {
        // 관리자의 상품관리페이지
        data = await this.#productService.getProducts(page, true);
      } else {
        throw Error('Not authorized, token failed');
      }
    } else {
      data = await this.#productService.getProducts(page, false, searchQuery);
    }
    res.status(HTTP_STATUS.OK).json(data);
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

    res.status(HTTP_STATUS.OK).json({ message });
  });

  // @desc   Fetch single product
  // @route  GET /api/products/:id
  // @access Public
  getProductById = asyncHandler(async (req, res) => {
    const data = await this.#productService.getProductById(req.params.id);

    if (!data) {
      res.statusCode(HTTP_STATUS.NOT_FOUND);
    } else {
      res.status(HTTP_STATUS.OK).json(data);
    }
  });
  //-------------
}

//-----

// @desc   Fetch single product
// @route  GET /api/products/:id
// @access Public
export const getProductById = asyncHandler(async (req, res) => {
  const productDetail = await Product.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } }, // 조회수 올리기!!
    {
      projection: {
        views: 0,
        updatedAt: 0,
      },
      new: true,
    },
  ).populate('artist', ['name', 'code', 'aka', 'record']);

  if (!productDetail) {
    res.status(404).json({ message: '해당 상품이 존재하지 않습니다' });
    return;
  }

  const productsByArtist = await Product.aggregate([
    { $match: { artist: productDetail.artist._id } },
    { $sample: { size: 4 } },
    { $project: { image: 1 } },
  ]);

  const productsByRandom = await Product.aggregate([
    { $match: { artist: { $ne: productDetail.artist._id } } },
    { $sample: { size: 8 } },
    { $project: { image: 1 } },
  ]);

  res.json({ productDetail, productsByArtist, productsByRandom });
});

// @desc   Fetch latest products
// @route  GET /api/products/latest
// @access Public
export const getLatestProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}, { image: 1 })
    .limit(5)
    .sort({ _id: -1 });

  if (products) res.json(products);
  else res.status(404).json({ message: '상품이 존재하지 않습니다' });
});

// @desc   Check stock of cartItems
// @route  GET /api/products/cart-items
// @access Public
export const getCartItems = asyncHandler(async (req, res) => {
  // 장바구니 상품 재고 확인 차 요청
  const { productId } = req.query;

  const products = await Product.find(
    { _id: { $in: productId } },
    {
      title: 1,
      image: 1,
      'info.size': 1,
      'info.canvas': 1,
      price: 1,
      inStock: 1,
    },
  ).populate('artist', ['name']);

  res.json(products);
});

// @desc   Fetch cartItems totalprice
// @route  GET /api/products/total-price
// @access Private
export const getTotalPrice = asyncHandler(async (req, res) => {
  // 결제로 넘어갈 시 총 상품 금액
  let { productId } = req.query;

  if (!Array.isArray(productId)) productId = [new ObjectId(productId)];
  else productId = productId.map((id) => new ObjectId(id));

  const totalPrice = await Product.aggregate([
    {
      $match: { _id: { $in: productId } },
    },
    {
      $group: {
        _id: '결제 예정 총 금액',
        totalPrice: { $sum: '$price' },
      },
    },
  ]);
  totalPrice[0].totalPrice = (totalPrice[0].totalPrice + 10000) / 1000;
  res.json(totalPrice[0]);
});

// @desc   Zzim or unZzim the product
// @route  PATCH /api/products/zzim
// @access Private
export const zzimProduct = asyncHandler(async (req, res) => {
  // 찜 해체 시에는 id가 배열로 올 수 있다. (선택삭제)
  const { productId, zzim } = req.body;

  if (zzim === undefined) {
    res.status(404).json({ message: 'true? or false?' });
    return;
  }

  if (zzim === true) {
    await Product.updateOne(
      { _id: productId },
      {
        $addToSet: { likes: req.user.id },
      },
      { upsert: true },
    ); // likes 배열에 유저 고유 아이디 넣기
    res.json({ message: '해당 상품 찜 완료' });
    return;
  }
  if (zzim === false) {
    await Product.updateMany(
      { _id: { $in: productId } },
      {
        $pull: { likes: req.user.id },
      },
      { multi: true },
    );
    res.json({ message: '해당 상품 찜 해제' });
  }
});

// @desc   Fetch products in zzimlist
// @route  GET /api/products/zzim
// @access Private
export const getZzimProducts = asyncHandler(async (req, res) => {
  const products = await Product.find(
    { likes: req.user.id },
    {
      title: 1,
      image: 1,
      'info.size': 1,
      'info.canvas': 1,
      price: 1,
      inStock: 1,
    },
  )
    .populate('artist', ['name'])
    .exec();

  res.json(products);
});

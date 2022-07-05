/* eslint-disable no-return-await */
import mongoose from 'mongoose';
import Product from '../database/mongoose/models/product.js';

const { ObjectId } = mongoose.Types;

export class ProductMongoRepository {
  #product;

  constructor(product) {
    this.#product = product;
  }

  async create(productEntity) {
    return await this.#product.create(productEntity);
  }

  async countDocsForAdmin() {
    return await this.#product.countDocuments({});
  }

  async findProductsForAdmin(pageSize, page, filter = {}) {
    return await this.#product
      .find({ ...filter })
      .populate('artist', ['name', 'aka', 'code', 'record'])
      .sort({ _id: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .exec();
  }

  async findProductsForUser(
    pageSize,
    page,
    filterField = {},
    keyword = undefined,
  ) {
    const keywordScope = organizeKeywordScope(keyword);
    const filterScope = organizeFilterScope(filterField);

    return await this.#product.aggregate([
      { $match: { inStock: true } },
      {
        $lookup: {
          from: 'artists',
          localField: 'artist',
          foreignField: '_id',
          as: 'artist',
        },
      },
      { $unwind: '$artist' },
      { $match: { ...keywordScope } },
      { $match: { ...filterScope } },
      {
        $project: {
          artCode: 0,
          theme: 0,
          inStock: 0,
          'info.details': 0,
          'info.createdAt': 0,
          'artist.code': 0,
          'artist.record': 0,
          'artist.thumbnail': 0,
          'artist.likes': 0,
          'artist.countOfWorks': 0,
          'artist.isActive': 0,
          'artist.joinAt': 0,
        },
      },
      { $sort: { _id: -1 } },
      { $skip: pageSize * (page - 1) },
      { $limit: pageSize },
    ]);
  }

  async countDocsForUser(keyword, filterField) {
    const keywordScope = organizeKeywordScope(keyword);
    const filterScope = organizeFilterScope(filterField);

    const count = await this.#product.aggregate([
      { $match: { inStock: true } },
      {
        $lookup: {
          from: 'artists',
          localField: 'artist',
          foreignField: '_id',
          as: 'artist',
        },
      },
      { $match: { ...keywordScope } },
      { $match: { ...filterScope } },
      { $count: 'of_products' },
    ]);

    return count[0].of_products;
  }

  async updateOne(productId, updateQuery) {
    return await this.#product.findByIdAndUpdate(
      productId,
      { ...updateQuery },
      {
        new: true,
      },
    );
  }

  async deleteOne(productId) {
    return await this.#product.findOneAndDelete({
      _id: productId,
      inStock: true,
    });
  }
  //-----
}

function organizeKeywordScope(keyword) {
  return keyword
    ? {
        $or: [
          {
            title: {
              $regex: keyword,
              $options: 'i',
            },
          },
          {
            'info.details': {
              $regex: keyword,
              $options: 'i',
            },
          },
          {
            'artist.name': {
              $regex: keyword,
              $options: 'i',
            },
          },
          {
            'artist.aka': {
              $regex: keyword,
              $options: 'i',
            },
          },
        ],
      }
    : {};
}

function organizeFilterScope(filterField) {
  if (!Object.keys(filterField).length) return {};

  const { theme, sizeMin, sizeMax, priceMin, priceMax } = filterField;

  let filterScope;

  if (theme) {
    filterScope = { theme };
  } else if (sizeMin && sizeMax) {
    filterScope = {
      'info.canvas': { $gte: Number(sizeMin), $lte: Number(sizeMax) },
    };
  } else if (priceMin && priceMax) {
    filterScope = {
      price: { $gte: Number(priceMin), $lte: Number(priceMax) },
    };
  } else if (priceMin) {
    filterScope = { price: { $gte: Number(priceMin) } };
  }
  return filterScope;
}
//-----------------

export async function findByIdAndCountView(productId) {
  return await Product.findByIdAndUpdate(
    productId,
    { $inc: { views: 1 } }, // 조회수 올리기
    {
      projection: {
        views: 0,
        updatedAt: 0,
      },
      new: true,
    },
  ).populate('artist', ['name', 'code', 'aka', 'record']);
}

export async function findManyForPromote(artistId, limit, option = undefined) {
  let match = artistId;
  if (option) {
    match = { $ne: artistId };
  }
  return await Product.aggregate([
    { $match: { artist: match } },
    { $sample: { size: limit } },
    { $project: { image: 1 } },
  ]);
}

export async function getLatest() {
  return await Product.find({}, { image: 1 }).limit(5).sort({ _id: -1 }).lean();
}

export async function findManyForCheck(filter) {
  return await Product.find(
    { ...filter },
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
}

export async function getTotalPrice(productId) {
  let mappedId = productId;
  if (!Array.isArray(productId)) mappedId = [new ObjectId(productId)];
  else mappedId = productId.map((id) => new ObjectId(id));

  return await Product.aggregate([
    {
      $match: { _id: { $in: mappedId } },
    },
    {
      $group: {
        _id: '결제 예정 총 금액',
        totalPrice: { $sum: '$price' },
      },
    },
  ]);
}

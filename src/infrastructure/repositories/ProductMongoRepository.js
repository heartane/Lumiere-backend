/* eslint-disable no-return-await */
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;

export default class ProductMongoRepository {
  #product;

  constructor(product) {
    this.#product = product;
  }

  async create(productEntity) {
    return await this.#product.create(productEntity).exec();
  }

  async countDocsForAdmin() {
    return await this.#product.countDocuments({}).lean().exec();
  }

  async findProductsForAdmin(pageSize, page, filter = {}) {
    return await this.#product
      .find({ ...filter })
      .populate('artist', ['name', 'aka', 'code', 'record'])
      .sort({ _id: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .lean()
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

    return await this.#product
      .aggregate([
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
      ])
      .exec();
  }

  async countDocsForUser(keyword, filterField) {
    const keywordScope = organizeKeywordScope(keyword);
    const filterScope = organizeFilterScope(filterField);

    const count = await this.#product
      .aggregate([
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
      ])
      .exec();

    return count[0].of_products;
  }

  async updateProductInput(productId, updateQuery) {
    return await this.#product
      .findByIdAndUpdate(
        productId,
        { ...updateQuery },
        {
          new: true,
        },
      )
      .lean()
      .exec();
  }

  async deleteOne(productId) {
    return await this.#product
      .findOneAndDelete({
        _id: productId,
        inStock: true,
      })
      .lean();
  }

  async findByIdAndCountView(productId) {
    return await this.#product
      .findByIdAndUpdate(
        productId,
        { $inc: { views: 1 } }, // 조회수 올리기
        {
          projection: {
            views: 0,
            updatedAt: 0,
          },
          new: true,
        },
      )
      .lean()
      .populate('artist', ['name', 'code', 'aka', 'record'])
      .exec();
  }

  async findManyForPromote(artistId, limit, option = undefined) {
    const matchQuery = option ? { $ne: artistId } : artistId;
    return await this.#product
      .aggregate([
        { $match: { artist: matchQuery } },
        { $sample: { size: limit } },
        { $project: { image: 1 } },
      ])
      .exec();
  }

  async getLatest() {
    return await this.#product
      .find({}, { image: 1 })
      .limit(5)
      .sort({ _id: -1 })
      .lean()
      .exec();
  }

  async findItemsForCheck(productIdArray) {
    return await this.#product
      .find(
        { _id: { $in: productIdArray } },
        {
          title: 1,
          image: 1,
          'info.size': 1,
          'info.canvas': 1,
          price: 1,
          inStock: 1,
        },
      )
      .lean()
      .populate('artist', ['name'])
      .exec();
  }

  async sumToPay(productIdArray) {
    const mappedId = productIdArray.map((id) => new ObjectId(id));

    return await this.#product
      .aggregate([
        {
          $match: { _id: { $in: mappedId } },
        },
        {
          $group: {
            _id: '결제 예정 총 금액',
            totalPrice: { $sum: '$price' },
          },
        },
      ])
      .exec();
  }

  async applyZzim(productId, userId) {
    return await this.#product
      .updateOne(
        { _id: productId },
        {
          $addToSet: { likes: userId },
        },
        { upsert: true },
      )
      .lean()
      .exec();
  }

  async cancelZzim(productId, userId) {
    // 찜 해체 시에는 id가 배열로 올 수 있다. (선택삭제)
    return await this.#product
      .updateMany(
        { _id: { $in: productId } },
        {
          $pull: { likes: userId },
        },
        { multi: true },
      )
      .lean()
      .exec();
  }

  async getZzimList(userId) {
    return await this.#product
      .find(
        { likes: userId },
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
      .lean()
      .exec();
  }
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
  }
  if (sizeMin && sizeMax) {
    filterScope = {
      'info.canvas': { $gte: Number(sizeMin), $lte: Number(sizeMax) },
    };
  }
  if (priceMin && priceMax) {
    filterScope = {
      price: { $gte: Number(priceMin), $lte: Number(priceMax) },
    };
  }
  if (priceMin) {
    filterScope = { price: { $gte: Number(priceMin) } };
  }
  return filterScope;
}

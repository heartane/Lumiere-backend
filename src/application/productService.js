/* eslint-disable no-return-await */
import Logger from '../infrastructure/express-server/logger.js';
import serviceLocator from '../infrastructure/config/serviceLocator.js';
import { serializePagination } from '../interface/helper/serializer.js';

export default class ProductService {
  #productRepository;

  #artistRepository;

  constructor(productRepository, artistRepository) {
    this.#productRepository = productRepository;
    this.#artistRepository = artistRepository;
  }

  async createProduct(productEntity) {
    let newProduct;
    try {
      await this.#artistRepository.raiseCountOfWorks(productEntity.artist);

      newProduct = await this.#productRepository.create(productEntity);
    } catch (e) {
      Logger.error(e.stack);
    }
    return newProduct;
  }

  async getProducts(page, isAdmin, searchKeyword = {}) {
    let pageSize;
    let count;
    let products;

    if (isAdmin) {
      pageSize = 10;

      try {
        Logger.debug('getProducts-ForAdmin');

        count = await this.#productRepository.countDocsForAdmin();
        products = await this.#productRepository.findProductsForAdmin(
          pageSize,
          page,
        );
      } catch (e) {
        Logger.error(e.stack);
      }
    } else {
      Logger.debug('getProducts-ForUser');

      pageSize = 28;
      const { keyword, ...filterField } = searchKeyword;

      try {
        products = await this.#productRepository.findProductsForUser(
          pageSize,
          page,
          filterField,
          keyword,
        );
        if (!products.length) {
          Logger.debug('no-such-product, []');
          return serializePagination({ products }, page, null, pageSize);
        }
        count = await this.#productRepository.countDocsForUser(
          keyword,
          filterField,
        );
      } catch (e) {
        Logger.error(e.stack);
      }
    }
    return serializePagination({ products }, page, count, pageSize);
  }

  async updateProduct(productId, updateQuery) {
    return await this.#productRepository.updateProductInput(
      productId,
      updateQuery,
    );
  }

  async deleteProduct(productId) {
    try {
      const deletedProduct = await this.#productRepository.deleteOne(productId);
      if (!deletedProduct) return false;
      await this.#artistRepository.reduceCountOfWorks(deletedProduct.artist);
      return true;
    } catch (e) {
      Logger.error(e.stack);
    }
    return null;
  }

  async getProductById(productId) {
    try {
      const productDetail = await this.#productRepository.findByIdAndCountView(
        productId,
      );
      const productsByArtist = await this.#productRepository.findManyForPromote(
        productDetail.artist._id,
        4,
      );
      const productsByRandom = await this.#productRepository.findManyForPromote(
        productDetail.artist._id,
        8,
        true,
      );
      return { productDetail, productsByArtist, productsByRandom };
    } catch (e) {
      Logger.error(e.stack);
    }
    return null;
  }

  async getLatestProducts() {
    return await this.#productRepository.getLatest();
  }

  async getCartItems(productIdArray) {
    return await this.#productRepository.findItemsForCheck(productIdArray);
  }

  async getTotalPrice(productIdArray) {
    const result = await this.#productRepository.sumToPay(productIdArray);
    const { totalPrice } = result[0];
    return { totalPrice: (totalPrice + 10000) / 1000 };
  }

  async zzimProduct(productId, userId, option) {
    try {
      let result;
      if (option) {
        await this.#productRepository.applyZzim(productId, userId);
        result = '해당 상품 찜 완료';
      } else {
        await this.#productRepository.cancelZzim(productId, userId);
        result = '해당 상품 찜 해제';
      }
      return result;
    } catch (e) {
      Logger.error(e.stack);
    }
    return null;
  }

  async getZzimProducts(userId) {
    return await this.#productRepository.getZzimList(userId);
  }
}

const productRepositoryInstance = serviceLocator().productRepository;
const artistRepositoryInstance = serviceLocator().artistRepository;

export const productService = new ProductService(
  productRepositoryInstance,
  artistRepositoryInstance,
);

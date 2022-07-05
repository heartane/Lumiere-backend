/* eslint-disable no-return-await */
import Logger from '../infrastructure/setup/logger.js';
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
    // 데이터 유효성 검사가 필요할까?
    return await this.#productRepository.updateOne(productId, updateQuery);
  }

  async deleteProduct(productId) {
    return await this.#artistRepository.deleteOne(productId);
  }

  //-------------
}

const productRepositoryInstance = serviceLocator().productRepository;
const artistRepositoryInstance = serviceLocator().artistRepository;

export const productService = new ProductService(
  productRepositoryInstance,
  artistRepositoryInstance,
);

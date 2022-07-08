/* eslint-disable no-return-await */
export default class ProductService {
  #productRepository;

  #artistRepository;

  constructor(productRepository, artistRepository, logger) {
    this.#productRepository = productRepository;
    this.#artistRepository = artistRepository;
    this.logger = logger;
  }

  async createProduct(productEntity) {
    try {
      await this.#artistRepository.raiseCountOfWorks(productEntity.artist);

      return await this.#productRepository.create(productEntity);
    } catch (e) {
      this.logger.error(e.stack);
    }
    return null;
  }

  async getProductsForAdmin(page) {
    this.logger.debug('getProducts-ForAdmin');

    const pageSize = 10;
    try {
      const count = await this.#productRepository.countDocsForAdmin();
      const products = await this.#productRepository.findProductsForAdmin(
        pageSize,
        page,
      );
      return { products, count, pageSize };
    } catch (e) {
      this.logger.error(e.stack);
    }
    return null;
  }

  async getProductsForUser(page, searchQuery) {
    this.logger.debug('getProducts-ForUser');

    const pageSize = 28;
    const { keyword, ...filterField } = searchQuery;

    try {
      const products = await this.#productRepository.findProductsForUser(
        pageSize,
        page,
        filterField,
        keyword,
      );
      if (!products.length) {
        this.logger.debug('no-such-product, []');
        return { products };
      }
      const count = await this.#productRepository.countDocsForUser(
        keyword,
        filterField,
      );
      return { products, count, pageSize };
    } catch (e) {
      this.logger.error(e.stack);
    }
    return null;
  }

  async getProducts(page, isAdmin, searchQuery = {}) {
    if (isAdmin) {
      return await this.getProductsForAdmin(page);
    }
    return await this.getProductsForUser(page, searchQuery);
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
      this.logger.error(e.stack);
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
      this.logger.error(e.stack);
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
      if (option) {
        return await this.#productRepository.applyZzim(productId, userId);
      }
      return await this.#productRepository.cancelZzim(productId, userId);
    } catch (e) {
      this.logger.error(e.stack);
    }
    return null;
  }

  async getZzimProducts(userId) {
    return await this.#productRepository.getZzimList(userId);
  }
}

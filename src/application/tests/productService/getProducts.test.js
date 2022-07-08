import ProductService from '../../productService';
import * as fakeProductRepo from '../fixtures/fakeProductRepository';
import ArtistMongoRepository from '../../../infrastructure/repositories/ArtistMongoRepository';
import ProductMongoRepository from '../../../infrastructure/repositories/ProductMongoRepository';
import Logger from '../../../infrastructure/express-server/logger';

describe('🎯 ProductService ➡ ⛳️ getProducts', () => {
  let productService;
  let productRepository;
  let artistRepository;

  beforeEach(() => {
    productRepository = new ProductMongoRepository();
    artistRepository = new ArtistMongoRepository();
    productService = new ProductService(
      productRepository,
      artistRepository,
      Logger,
    );
  });
  const page = 1;
  const pageSize = 10;
  const fakeServeralProducts = fakeProductRepo.severalProducts;
  let isAdmin;

  describe('🚧 for Admin Page', () => {
    beforeEach(() => {
      isAdmin = true;
    });

    it('해당 페이지 범위의 상품 정보 리스트와 페이지네이션 정보(현재 페이지, 총 페이지)를 반환한다', async () => {
      // given
      productRepository.findProductsForAdmin = jest.fn(
        () => fakeServeralProducts,
      );
      productRepository.countDocsForAdmin = jest.fn(() => 5);

      // when
      const data = await productService.getProducts(page, isAdmin);

      // then
      expect(data).toMatchObject({
        products: productRepository.findProductsForAdmin(),
        count: productRepository.countDocsForAdmin(),
        pageSize,
      });
    });

    it('countDocsForAdmin(), 전체 상품의 개수를 반환한다', async () => {
      // given
      productRepository.countDocsForAdmin = jest.fn(() => 5);
      productRepository.findProductsForAdmin = jest.fn();

      // when
      await productService.getProducts(page, isAdmin);

      // then
      expect(productRepository.countDocsForAdmin).toBeCalledTimes(1);
      expect(productRepository.countDocsForAdmin()).toBe(5);
    });

    it('findProductsForAdmin(), 상품 정보에는 작가명, 작가활동명, 작가코드, 작가의 말을 포함한다', async () => {
      // given
      productRepository.countDocsForAdmin = jest.fn();
      productRepository.findProductsForAdmin = jest.fn(() => {
        return fakeServeralProducts;
      });
      const products = productRepository.findProductsForAdmin();
      // when

      await productService.getProducts(page, isAdmin);

      // then
      expect(products[0]).toHaveProperty('artist._id');
      expect(products[0]).toHaveProperty('artist.name');
      expect(products[0]).toHaveProperty('artist.aka');
      expect(products[0]).toHaveProperty('artist.code');
      expect(products[0]).toHaveProperty('artist.record');
    });
  });

  describe('🚧 for General Page', () => {
    let searchKeyword;

    beforeEach(() => {
      isAdmin = false;
    });

    it('searchKeyword(키워드 및 필터 범위)가 없다면, 재고가 있는 상품 정보 리스트에 한해 페이지네이션한다', async () => {
      // given
      searchKeyword = {};
      const { keyword, ...filterField } = searchKeyword;

      productRepository.countDocsForUser = jest.fn();
      productRepository.findProductsForUser = jest.fn(
        () => fakeServeralProducts,
      );

      // when
      const { products } = await productService.getProducts(
        page,
        isAdmin,
        searchKeyword,
      );

      // then
      expect(filterField).toEqual({});
      expect(keyword).toBeUndefined();
      expect(products.length).not.toBeUndefined();
    });

    it('searchKeyword(키워드)가 있다면, 재고가 있는 상품 중 쿼리에 부합하는 상품 정보 리스트로 페이지네이션한다', async () => {
      // given
      searchKeyword = { keyword: '우주' };
      const { keyword, ...filterField } = searchKeyword;

      productRepository.countDocsForUser = jest.fn();
      productRepository.findProductsForUser = jest.fn(
        () => fakeServeralProducts,
      );

      // when
      const { products } = await productService.getProducts(
        page,
        isAdmin,
        searchKeyword,
      );
      // then
      expect(filterField).toEqual({});
      expect(keyword).not.toBeUndefined();
      expect(products.length).not.toBeUndefined();
    });

    it('searchKeyword(필터범위)가 있다면, 재고가 있는 상품 중 쿼리에 부합하는 상품 정보 리스트로 페이지네이션한다', async () => {
      // given
      searchKeyword = { theme: '추상' };
      const { keyword, ...filterField } = searchKeyword;

      productRepository.countDocsForUser = jest.fn();
      productRepository.findProductsForUser = jest.fn(
        () => fakeServeralProducts,
      );

      // when
      const { products } = await productService.getProducts(
        page,
        isAdmin,
        searchKeyword,
      );
      // then
      expect(filterField).toHaveProperty('theme', '추상');
      expect(filterField.theme).toBe('추상');
      expect(keyword).toBeUndefined();
      expect(products.length).not.toBeUndefined();
    });

    it('searchKeyword(키워드 및 필터범위) 쿼리에 부합하는 상품이 없다면, 빈 배열와 현재 페이지, 총 페이지를 1로 설정한다', async () => {
      // giver
      searchKeyword = { keyword: '우주', theme: '추상' };
      const { keyword, ...filterField } = searchKeyword;

      productRepository.countDocsForUser = jest.fn();
      productRepository.findProductsForUser = jest.fn(() => []);

      // when
      const data = await productService.getProducts(
        page,
        isAdmin,
        searchKeyword,
      );

      // then
      expect(filterField).not.toEqual({});
      expect(keyword).not.toBeUndefined();
      expect(data.products.length).toBe(0);
    });
  });
});

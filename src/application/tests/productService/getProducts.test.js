import ProductService from '../../productService';
import * as fakeProductRepo from '../fixtures/fakeProductRepository';
import ArtistMongoRepository from '../../../infrastructure/repositories/ArtistMongoRepository';
import ProductMongoRepository from '../../../infrastructure/repositories/ProductMongoRepository';
import Logger from '../../../infrastructure/express-server/logger';

describe('π― ProductService β‘ β³οΈ getProducts', () => {
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

  describe('π§ for Admin Page', () => {
    beforeEach(() => {
      isAdmin = true;
    });

    it('ν΄λΉ νμ΄μ§ λ²μμ μν μ λ³΄ λ¦¬μ€νΈμ νμ΄μ§λ€μ΄μ μ λ³΄(νμ¬ νμ΄μ§, μ΄ νμ΄μ§)λ₯Ό λ°ννλ€', async () => {
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

    it('countDocsForAdmin(), μ μ²΄ μνμ κ°μλ₯Ό λ°ννλ€', async () => {
      // given
      productRepository.countDocsForAdmin = jest.fn(() => 5);
      productRepository.findProductsForAdmin = jest.fn();

      // when
      await productService.getProducts(page, isAdmin);

      // then
      expect(productRepository.countDocsForAdmin).toBeCalledTimes(1);
      expect(productRepository.countDocsForAdmin()).toBe(5);
    });

    it('findProductsForAdmin(), μν μ λ³΄μλ μκ°λͺ, μκ°νλλͺ, μκ°μ½λ, μκ°μ λ§μ ν¬ν¨νλ€', async () => {
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

  describe('π§ for General Page', () => {
    let searchKeyword;

    beforeEach(() => {
      isAdmin = false;
    });

    it('searchKeyword(ν€μλ λ° νν° λ²μ)κ° μλ€λ©΄, μ¬κ³ κ° μλ μν μ λ³΄ λ¦¬μ€νΈμ νν΄ νμ΄μ§λ€μ΄μνλ€', async () => {
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

    it('searchKeyword(ν€μλ)κ° μλ€λ©΄, μ¬κ³ κ° μλ μν μ€ μΏΌλ¦¬μ λΆν©νλ μν μ λ³΄ λ¦¬μ€νΈλ‘ νμ΄μ§λ€μ΄μνλ€', async () => {
      // given
      searchKeyword = { keyword: 'μ°μ£Ό' };
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

    it('searchKeyword(νν°λ²μ)κ° μλ€λ©΄, μ¬κ³ κ° μλ μν μ€ μΏΌλ¦¬μ λΆν©νλ μν μ λ³΄ λ¦¬μ€νΈλ‘ νμ΄μ§λ€μ΄μνλ€', async () => {
      // given
      searchKeyword = { theme: 'μΆμ' };
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
      expect(filterField).toHaveProperty('theme', 'μΆμ');
      expect(filterField.theme).toBe('μΆμ');
      expect(keyword).toBeUndefined();
      expect(products.length).not.toBeUndefined();
    });

    it('searchKeyword(ν€μλ λ° νν°λ²μ) μΏΌλ¦¬μ λΆν©νλ μνμ΄ μλ€λ©΄, λΉ λ°°μ΄μ νμ¬ νμ΄μ§, μ΄ νμ΄μ§λ₯Ό 1λ‘ μ€μ νλ€', async () => {
      // giver
      searchKeyword = { keyword: 'μ°μ£Ό', theme: 'μΆμ' };
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

import ArtistMongoRepository from '../../../infrastructure/repositories/ArtistMongoRepository';
import ProductMongoRepository from '../../../infrastructure/repositories/ProductMongoRepository';
import ProductService from '../../productService';
import * as fakeProductRepo from '../fixtures/fakeProductRepository';

describe('🎯 ProductService ➡ ⛳️ getProductById (상품 상세페이지)', () => {
  let productService;
  let productRepository;
  let artistRepository;
  let fakeProductInfo;

  beforeEach(() => {
    productRepository = new ProductMongoRepository();
    artistRepository = new ArtistMongoRepository();
    productService = new ProductService(productRepository, artistRepository);
    fakeProductInfo = fakeProductRepo.singleProductWithPopulation;
  });

  it('해당 productId가 유효하다면 Null을 반환하지 않는다,', async () => {
    // given
    productRepository.findByIdAndCountView = jest.fn(() => fakeProductInfo);
    productRepository.findManyForPromote = jest.fn();

    // when
    const result = await productService.getProductById(fakeProductInfo._id);

    // then
    expect(result).not.toBeNull();
  });

  it('반환 객체는 productDetail, productsByArtist, productsByRandom 속성을 가진다. (상품 디테일 정보와 추천 상품 리스트),', async () => {
    // given
    productRepository.findByIdAndCountView = jest.fn(() => fakeProductInfo);
    productRepository.findManyForPromote = jest.fn();

    // when
    const result = await productService.getProductById(fakeProductInfo._id);

    // then
    expect(result).toHaveProperty('productDetail');
    expect(result).toHaveProperty('productsByArtist');
    expect(result).toHaveProperty('productsByRandom');
  });

  it('추천 상품 리스트의 파라미터로 해당 상품의 작가ID, 상품 갯수, 옵션을 넘긴다', async () => {
    // given
    productRepository.findByIdAndCountView = jest.fn(() => fakeProductInfo);
    const fakeFindManyForPromote = jest.spyOn(
      productRepository,
      'findManyForPromote',
    );
    fakeFindManyForPromote.mockImplementation(() => true);

    // when
    await productService.getProductById(fakeProductInfo._id);

    // then
    expect(fakeFindManyForPromote).toBeCalledTimes(2);
    expect(fakeFindManyForPromote).nthCalledWith(
      1,
      fakeProductInfo.artist._id,
      4,
    );
    expect(fakeFindManyForPromote).nthCalledWith(
      2,
      fakeProductInfo.artist._id,
      8,
      true,
    );
  });
});

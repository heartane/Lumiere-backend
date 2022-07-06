import ArtistMongoRepository from '../../../infrastructure/repositories/ArtistMongoRepository';
import ProductMongoRepository from '../../../infrastructure/repositories/ProductMongoRepository';
import ProductService from '../../productService';
import * as fakeProductRepo from '../fixtures/fakeProductRepository';

describe('🎯 ProductService ➡ ⛳️ deleteProduct', () => {
  let productService;
  let productRepository;
  let artistRepository;
  let fakeProductInfo;

  beforeEach(() => {
    productRepository = new ProductMongoRepository();
    artistRepository = new ArtistMongoRepository();
    productService = new ProductService(productRepository, artistRepository);
    fakeProductInfo = fakeProductRepo.singleProduct;
  });

  it('해당 productId 상품이 재고가 없다면, 삭제할 수 없어 false를 반환한다', async () => {
    // given
    productRepository.deleteOne = jest.fn(() => null);
    const fakeReduceCountOfWorks = jest.spyOn(
      artistRepository,
      'reduceCountOfWorks',
    );

    // when
    const result = await productService.deleteProduct(fakeProductInfo._id);

    // then
    expect(fakeReduceCountOfWorks).toBeCalledTimes(0);
    expect(productRepository.deleteOne()).toBeNull();
    expect(result).toBe(false);
  });

  it('해당 productId 상품이 재고가 있다면, 삭제가 가능하며 true를 반환한다', async () => {
    // given
    productRepository.deleteOne = jest.fn(() => fakeProductInfo);
    artistRepository.reduceCountOfWorks = jest.fn();

    // when
    const result = await productService.deleteProduct(fakeProductInfo._id);

    // then
    expect(productRepository.deleteOne()).not.toBeNull();
    expect(result).toBe(true);
  });

  it('해당 productId 상품이 재고가 있다면, 삭제 후 작가의 작품 수 카운트도 -1 차감한다', async () => {
    // given
    productRepository.deleteOne = jest.fn(() => fakeProductInfo);
    const fakeReduceCountOfWorks = jest.spyOn(
      artistRepository,
      'reduceCountOfWorks',
    );
    fakeReduceCountOfWorks.mockImplementation(() => true);

    // when
    await productService.deleteProduct(fakeProductInfo._id);

    // then
    expect(fakeReduceCountOfWorks).toBeCalledTimes(1);
    expect(fakeReduceCountOfWorks).toBeCalledWith(fakeProductInfo.artist);
  });
});

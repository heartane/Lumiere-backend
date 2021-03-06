import ArtistMongoRepository from '../../../infrastructure/repositories/ArtistMongoRepository';
import ProductMongoRepository from '../../../infrastructure/repositories/ProductMongoRepository';
import ProductService from '../../productService';
import * as fakeProductRepo from '../fixtures/fakeProductRepository';

describe('๐ฏ ProductService โก โณ๏ธ deleteProduct', () => {
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

  it('ํด๋น productId ์ํ์ด ์ฌ๊ณ ๊ฐ ์๋ค๋ฉด, ์ญ์ ํ  ์ ์์ด false๋ฅผ ๋ฐํํ๋ค', async () => {
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

  it('ํด๋น productId ์ํ์ด ์ฌ๊ณ ๊ฐ ์๋ค๋ฉด, ์ญ์ ๊ฐ ๊ฐ๋ฅํ๋ฉฐ true๋ฅผ ๋ฐํํ๋ค', async () => {
    // given
    productRepository.deleteOne = jest.fn(() => fakeProductInfo);
    artistRepository.reduceCountOfWorks = jest.fn();

    // when
    const result = await productService.deleteProduct(fakeProductInfo._id);

    // then
    expect(productRepository.deleteOne()).not.toBeNull();
    expect(result).toBe(true);
  });

  it('ํด๋น productId ์ํ์ด ์ฌ๊ณ ๊ฐ ์๋ค๋ฉด, ์ญ์  ํ ์๊ฐ์ ์ํ ์ ์นด์ดํธ๋ -1 ์ฐจ๊ฐํ๋ค', async () => {
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

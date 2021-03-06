import ArtistMongoRepository from '../../../infrastructure/repositories/ArtistMongoRepository';
import ProductMongoRepository from '../../../infrastructure/repositories/ProductMongoRepository';
import ProductService from '../../productService';
import * as fakeProductRepo from '../fixtures/fakeProductRepository';

describe('π― ProductService β‘ β³οΈ getProductById (μν μμΈνμ΄μ§)', () => {
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

  it('ν΄λΉ productIdκ° μ ν¨νλ€λ©΄ Nullμ λ°ννμ§ μλλ€,', async () => {
    // given
    productRepository.findByIdAndCountView = jest.fn(() => fakeProductInfo);
    productRepository.findManyForPromote = jest.fn();

    // when
    const result = await productService.getProductById(fakeProductInfo._id);

    // then
    expect(result).not.toBeNull();
  });

  it('λ°ν κ°μ²΄λ productDetail, productsByArtist, productsByRandom μμ±μ κ°μ§λ€. (μν λνμΌ μ λ³΄μ μΆμ² μν λ¦¬μ€νΈ),', async () => {
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

  it('μΆμ² μν λ¦¬μ€νΈμ νλΌλ―Έν°λ‘ ν΄λΉ μνμ μκ°ID, μν κ°―μ, μ΅μμ λκΈ΄λ€', async () => {
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

import ProductService from '../../productService';
import * as fakeProductRepo from '../fixtures/fakeProductRepository';
import ArtistMongoRepository from '../../../infrastructure/repositories/ArtistMongoRepository';
import ProductMongoRepository from '../../../infrastructure/repositories/ProductMongoRepository';

describe(' π― ProductService β‘ β³οΈ createProduct', () => {
  let productService;
  let productRepository;
  let artistRepository;
  let fakeProductInputData;

  beforeEach(() => {
    productRepository = new ProductMongoRepository();
    artistRepository = new ArtistMongoRepository();
    productService = new ProductService(productRepository, artistRepository);
    fakeProductInputData = fakeProductRepo.productInputData;
  });

  it('raiseCountOfWorks()μ μΈμλ‘ artistIdκ° μ λ¬λμ΄μΌ νλ€', async () => {
    // given
    const fakeRaiseCountOfWorks = jest.spyOn(
      artistRepository,
      'raiseCountOfWorks',
    );
    fakeRaiseCountOfWorks.mockImplementation(() => 5);
    productRepository.create = jest.fn();

    // when
    await productService.createProduct(fakeProductInputData);

    // then
    expect(fakeRaiseCountOfWorks).toBeCalledWith(fakeProductInputData.artist);
  });

  it('create()μ μΈμλ‘ procductEntity κ°μ²΄κ° μ λ¬λμ΄μΌ νλ€', async () => {
    // given
    artistRepository.raiseCountOfWorks = jest.fn();
    const fakeCreate = jest.spyOn(productRepository, 'create');
    fakeCreate.mockImplementation(() => fakeProductRepo.singleProduct);

    // when
    await productService.createProduct(fakeProductInputData);

    // then
    expect(fakeCreate).toBeCalledWith(fakeProductInputData);
  });

  it('μκ°μ μν μ μΉ΄μ΄νΈλ₯Ό νλ μ¬λ¦¬κ³ , μλ‘μ΄ μνμ μμ±νλ€', async () => {
    // given
    artistRepository.raiseCountOfWorks = jest.fn();
    const fakeCreate = jest.spyOn(productRepository, 'create');
    fakeCreate.mockImplementation(() => fakeProductRepo.singleProduct);

    // when
    const newProduct = await productService.createProduct(fakeProductInputData);

    // then
    expect(newProduct).toHaveProperty('_id');
    expect(newProduct).toHaveProperty('likes', []);
    expect(newProduct).toHaveProperty('veiws', 0);
    expect(newProduct).toHaveProperty('inStorck', true);
    expect(newProduct).toHaveProperty('updatedAt');
  });
});

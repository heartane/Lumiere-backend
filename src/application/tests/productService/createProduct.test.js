import ProductService from '../../productService';
import * as fakeProductRepo from '../fixtures/fakeProductRepository';
import ArtistMongoRepository from '../../../infrastructure/repositories/ArtistMongoRepository';
import { ProductMongoRepository } from '../../../infrastructure/repositories/ProductMongoRepository';

describe(' 🎯 ProductService ➡ ⛳️ createProduct', () => {
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

  it('raiseCountOfWorks()의 인자로 artistId가 전달되어야 한다', async () => {
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

  it('create()의 인자로 procductEntity 객체가 전달되어야 한다', async () => {
    // given
    artistRepository.raiseCountOfWorks = jest.fn();
    const fakeCreate = jest.spyOn(productRepository, 'create');
    fakeCreate.mockImplementation(() => fakeProductRepo.singleProduct);

    // when
    await productService.createProduct(fakeProductInputData);

    // then
    expect(fakeCreate).toBeCalledWith(fakeProductInputData);
  });

  it('작가의 작품 수 카운트를 하나 올리고, 새로운 상품을 생성한다', async () => {
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

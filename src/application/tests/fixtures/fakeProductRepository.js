import { faker } from '@faker-js/faker';

export const productInputData = {
  artist: faker.random.alphaNumeric(24),
  artCode: faker.random.numeric(4),
  title: faker.random.word(),
  theme: '추상',
  info: {
    details: faker.random.words(2),
    size: faker.random.word(),
    canvas: 80,
    createdAt: faker.random.numeric(4),
  },
  price: faker.random.numeric(6),
};

const { artist, artCode, ...productDataOnly } = productInputData;

export const singleProduct = {
  ...productDataOnly,
  _id: faker.random.alphaNumeric(24),
  likes: [],
  veiws: 0,
  inStorck: true,
  updatedAt: faker.date.recent(),
};

export const severalProducts = [
  {
    ...singleProduct,
    artist: {
      _id: faker.random.alphaNumeric(24),
      name: faker.random.word(),
      aka: faker.random.word(),
      code: faker.random.numeric(4),
      record: faker.random.words(5),
    },
  },
];

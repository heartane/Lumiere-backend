import dotenv from 'dotenv';

const envFile = dotenv.config();

if (!envFile) {
  throw new Error(`Can not find .env file`);
}

function required(key, defaultValue = undefined) {
  const value = process.env[key] || defaultValue;

  if (value == null) {
    throw new Error(`Env key ${key} is required`);
  }
  return value;
}

export default {
  server: {
    port: parseInt(required('PORT', 8080)),
    env: required('NODE_ENV', 'development'),
  },
  database: { url: required('MONGODB_URI') },
  cors: { origin: required('CORS_ORIGIN') },
  bcrypt: {
    saltRounds: parseInt(required('SALT_ROUNDS', 10)),
  },
  jwt: {
    secretKey: required('JWT_SECRET_KEY'),
    expireTime: required('JWT_EXPIRATION_TIME'),
  },
};

/* 
환경변수의 경우 서버 실행 시에 반영되기 때문에, 자동완성이 안된다.
.env 파일에서 키값을 잘 복사에서 붙이지 않으면, 오타가 나기 쉽상이다.
따라서 자동완성 기능을 이용하기 위해서 한 파일에 환경 변수 몰아넣기.
*/

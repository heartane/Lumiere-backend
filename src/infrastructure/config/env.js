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
    port: Number(required('PORT', 8080)),
    env: required('NODE_ENV'),
  },
  apiRoot: required('API_ROOT'),
  database: {
    adaptor: required('DB_ADAPTOR'),
    url: required('MONGODB_URI'),
  },
  cors: { origin: required('CORS_ORIGIN') },
  bcrypt: {
    saltRounds: 10,
  },
  jwt: {
    secretKey: required('JWT_SECRET_KEY'),
    expireTime: required('JWT_EXPIRATION_TIME'),
  },
  oauth: {
    redirectUri: required('REDIRECT_URI'),
    kakao: {
      clientId: required('KAKAO_CLIENT_ID'),
      clientSecret: required('KAKAO_CLIENT_SECRET'),
    },
    google: {
      clientId: required('GOOGLE_CLIENT_ID'),
      clientSecret: required('GOOGLE_CLIENT_SECRET'),
    },
    naver: {
      clientId: required('NAVER_CLIENT_ID'),
      clientSecret: required('NAVER_CLIENT_SECRET'),
      state: required('NAVER_STATE'),
    },
  },
  pagination: {
    pageSize: 10,
  },
};

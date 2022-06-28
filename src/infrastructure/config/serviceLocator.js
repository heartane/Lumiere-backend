import env from './env.js';
import User from '../database/mongoose/models/user.js';
import { UserMongoRepository } from '../repositories/UserMongoRepository.js';
import { SUPPORTED_DATABASE } from './constants.js';

/* 
데이터베이스를 상황에 따라 탈부착을 할 수 있게 하고,
그에 따른 레포지토리 인스턴스를 생성하기 위한 연결 장치.

서버 실행 시 최초 한번만 주입되고 그 인스턴스를 계속 사용하여야 함.
그럼 클로저 형태로 인스턴스를 생성한 것을 유지할 수 있지 않을까?
*/

function injectDatabase() {
  const repoBucket = {};
  if (env.database.adaptor === SUPPORTED_DATABASE.MONGO) {
    repoBucket.userRepository = new UserMongoRepository(User);
  }
  return () => repoBucket;
}

export default injectDatabase();

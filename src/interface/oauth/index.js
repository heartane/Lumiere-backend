import Google from './google.js';
import Kakao from './kakao.js';
import Naver from './naver.js';

export default function factoryForOauth(corporation, code, logger) {
  switch (corporation) {
    case 'google':
      return new Google(code, logger);
    case 'kakao':
      return new Kakao(code, logger);
    case 'naver':
      return new Naver(code, logger);
    default:
      return null;
  }
}

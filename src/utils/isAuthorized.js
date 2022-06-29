import jwtManager from '../infrastructure/setup/security/jwtTokenManager';

const isAuthorized = (req) => {
  const { authorization } = req.headers;

  if (authorization && authorization.startsWith('Bearer')) {
    // eslint-disable-next-line prefer-destructuring
    const token = authorization.split(' ')[1];
    try {
      return jwtManager.verify(token);
    } catch (e) {
      // when token expired
      return null;
    }
  }
  return null;
};

export default isAuthorized;

import jwtManager from '../infrastructure/setup/security/jwtTokenManager.js';

const isAuthorized = (req) => {
  const { authorization } = req.headers;

  if (!authorization?.startsWith('Bearer')) {
    return null;
  }
  // eslint-disable-next-line prefer-destructuring
  const token = authorization.split(' ')[1];
  try {
    return jwtManager.verify(token);
  } catch (e) {
    // when token expired
    return null;
  }
};

export default isAuthorized;

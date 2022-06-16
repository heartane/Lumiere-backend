import jwt from 'jsonwebtoken';

const generateAccessToken = (id, isAdmin) => {
  return jwt.sign({ id, isAdmin }, process.env.JWT_SECRET_KEY, {
    expiresIn: '6h',
  });
};

export default generateAccessToken;

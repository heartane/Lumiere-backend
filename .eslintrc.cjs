module.exports = {
  extends: ['./.eslintrc-base.json'],

  parserOptions: {
    ecmaVersion: 13,
  },
  env: {
    'jest/globals': true,
  },
};

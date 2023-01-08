module.exports = {
  root: true,
  env: {
    // es6: true,
    node: true,
    es2020: true,
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    // "node/no-unsupported-features/es-syntax": "error",
    "indent": "off",
    "quotes": ["error", "double"],
    "no-console": "off",
  },

  parserOptions: {
    // sourceType: "commonjs",
    ecmaVersion: 11,
  },
};

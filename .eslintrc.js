module.exports = {
  extends: ["eslint:recommended", "plugin:promise/recommended"],
  parserOptions: {
    ecmaVersion: 8,
  },
  overrides: [
    {
      files: ["test/**"],
      plugins: ["jest"],
      extends: ["plugin:jest/recommended"],
    },
    {
      files: ["*.ts"],
      plugins: ["@typescript-eslint"],
      extends: ["plugin:@typescript-eslint/recommended"],
      parser: "@typescript-eslint/parser",
    },
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
};

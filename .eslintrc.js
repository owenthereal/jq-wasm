module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:promise/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2021, // Use the latest stable ECMAScript version
    sourceType: "module",
  },
  overrides: [
    {
      files: ["test/**"],
      plugins: ["jest"],
      extends: ["plugin:jest/recommended"],
      env: {
        jest: true,
      },
    },
    {
      files: ["*.ts", "*.d.ts"], // Include TypeScript and declaration files
      plugins: ["@typescript-eslint"],
      extends: [
        "plugin:@typescript-eslint/recommended",
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
      },
    },
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  rules: {
    // Custom rules can be added here
  },
};

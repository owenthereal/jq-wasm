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
      files: ["src/tests/**"],
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
        "plugin:@typescript-eslint/eslint-recommended"
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        project: "./tsconfig.eslint.json"
      },
    },
  ],
  ignorePatterns: ["src/pre.js", "src/build/**/*"],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  rules: {
    // TypeScript-specific rules
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-module-boundary-types": "off", // Disable requiring explicit return types
    "@typescript-eslint/no-explicit-any": "off", // Allow using `any` in specific scenarios
    "@typescript-eslint/no-var-requires": "off", // Allow CommonJS `require`
    // Promise-specific rules
    "promise/always-return": "off", // Allow async functions without explicit return
    "promise/catch-or-return": "off", // Allow omitting `.catch` in some cases
  },
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Watchman's state file is not writable in some sandboxes; use the node crawler.
  watchman: false,
  // The main tsconfig targets ESNext for the edge/browser wrappers; the Node
  // suite only exercises index.ts/jq-api.ts, so run it as CommonJS here. The
  // Workers suite (*.workers.test.ts) runs under vitest, not jest.
  testPathIgnorePatterns: ['/node_modules/', '\\.workers\\.test\\.ts$'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: { module: 'CommonJS', moduleResolution: 'node', types: ['node', 'jest'] } },
    ],
  },
};

const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

const baseProject = {
  rootDir: '.',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.(spec|test)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: compilerOptions.paths
    ? pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
    : {},
};

module.exports = {
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    '!packages/*/src/**/*.spec.ts',
    '!packages/*/src/**/*.test.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  projects: [
    {
      ...baseProject,
      displayName: '@silkon/common',
      roots: ['<rootDir>/packages/common/src', '<rootDir>/packages/common/test'],
      setupFiles: ['<rootDir>/packages/common/test/mocks/env.mock.ts'],
    },
    {
      ...baseProject,
      displayName: '@silkon/core',
      roots: ['<rootDir>/packages/core/src', '<rootDir>/packages/core/test'],
      setupFiles: ['<rootDir>/packages/core/test/mocks/env.mock.ts'],
    },
  ],
};

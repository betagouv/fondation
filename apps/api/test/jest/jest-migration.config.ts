import { type JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  rootDir: '../../src',
  globalSetup: '<rootDir>/../test/setup-postgresql-docker.ts',
  globalTeardown: '<rootDir>/../test/teardown-postgresql-docker.ts',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  testMatch: ['**/src/**/*.mig-spec.(ts)'],
  testEnvironment: 'node',
  modulePaths: ['<rootDir>/../'],
  collectCoverageFrom: ['<rootDir>/**/*.ts', '!<rootDir>/**/*.mig-spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/../test/jest/custom-expects.ts'],
};

export default jestConfig;

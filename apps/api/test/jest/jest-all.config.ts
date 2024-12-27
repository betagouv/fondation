import { type JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  rootDir: '../../src',
  globalSetup: '<rootDir>/../test/setup-postgresql-docker-with-migrations.ts',
  globalTeardown: '<rootDir>/../test/teardown-postgresql-docker.ts',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts)$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
  testMatch: [
    '<rootDir>/../**/{src,cli}/**/*.spec.(ts)',
    '<rootDir>/../**/{src,cli}/**/*.it-spec.(ts)',
    '<rootDir>/../**/{src,cli}/**/*.e2e-spec.(ts)',
  ],
  testEnvironment: 'node',
  modulePaths: ['<rootDir>/../'],
  collectCoverageFrom: [
    '<rootDir>/**/*.ts',
    '!<rootDir>/**/*.spec.ts',
    '!<rootDir>/**/*.it-spec.ts',
    '!<rootDir>/**/*.e2e-spec.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/../test/jest/custom-expects.ts'],
};

export default jestConfig;

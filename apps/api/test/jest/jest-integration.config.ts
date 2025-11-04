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
  testMatch: ['**/{src,cli}/**/*.it-spec.(ts)'],
  testEnvironment: 'node',
  modulePaths: ['<rootDir>/../'],
  collectCoverageFrom: ['<rootDir>/**/*.ts', '!<rootDir>/**/*.it-spec.ts'],
};

export default jestConfig;

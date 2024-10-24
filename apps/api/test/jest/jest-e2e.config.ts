import { type JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  rootDir: '../../',
  modulePaths: ['<rootDir>'],
  globalSetup: '<rootDir>/test/setup-postgresql-docker.ts',
  globalTeardown: '<rootDir>/test/teardown-postgresql-docker.ts',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  testMatch: ['**/{src,cli}/**/*.e2e-spec.(ts)'],
  testEnvironment: 'node',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.e2e-spec.ts',
  ],
};

export default jestConfig;

import { type JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  rootDir: '../../',
  modulePaths: ['<rootDir>'],
  globalSetup: '<rootDir>/test/setup-postgresql-docker-with-migrations.ts',
  globalTeardown: '<rootDir>/test/teardown-postgresql-docker.ts',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts)$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
  testMatch: ['**/{src,cli}/**/*.e2e-spec.(ts)'],
  testEnvironment: 'node',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.e2e-spec.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/jest/custom-expects.ts'],
};

export default jestConfig;

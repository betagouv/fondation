import { type JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  rootDir: '../../src',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts)$': [
      'ts-jest',
      {
        isolatedModules: true,
      },
    ],
  },
  testMatch: ['**/src/**/*.mig-spec.(ts)'],
  testEnvironment: 'node',
  modulePaths: ['<rootDir>/../'],
  collectCoverageFrom: ['<rootDir>/**/*.ts', '!<rootDir>/**/*.mig-spec.ts'],
};

export default jestConfig;

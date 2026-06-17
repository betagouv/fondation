import { type JestConfigWithTsJest } from 'ts-jest';

process.env.TZ = 'Etc/UTC';

const jestConfig: JestConfigWithTsJest = {
  rootDir: '../../src',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
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
};

export default jestConfig;

import { type JestConfigWithTsJest } from 'ts-jest';

process.env.TZ = 'Etc/UTC';

const config: JestConfigWithTsJest = {
  rootDir: '../../src',
  modulePaths: ['<rootDir>/../'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts)$': ['ts-jest', { diagnostics: false }],
  },
  collectCoverageFrom: ['**/*.(ts)'],
  coverageDirectory: '<rootDir>/../coverage',
  testEnvironment: 'node',
};

export default config;

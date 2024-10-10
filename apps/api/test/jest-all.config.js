// eslint-disable-next-line no-undef
module.exports = {
  rootDir: '..',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: [
    '<rootDir>**/src/**/*.spec.(ts)',
    '<rootDir>**/src/**/*.e2e-spec.(ts)',
  ],
  testEnvironment: 'node',
  modulePaths: ['<rootDir>'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.e2e-spec.ts',
  ],
};

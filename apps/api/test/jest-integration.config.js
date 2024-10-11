// eslint-disable-next-line no-undef
module.exports = {
  rootDir: '..',
  globalSetup: '<rootDir>/test/setup-postgresql-docker.ts',
  globalTeardown: '<rootDir>/test/teardown-postgresql-docker.ts',
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/src/**/*.it-spec.(ts)'],
  testEnvironment: 'node',
  modulePaths: ['<rootDir>'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.it-spec.ts',
  ],
};

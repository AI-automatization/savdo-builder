import type { Config } from 'jest';

// Unit-тесты (без БД). Файлы *.spec.ts рядом с реализацией.
// Для e2e — отдельный jest-e2e.config.ts.
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.test.json' }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coveragePathIgnorePatterns: ['/node_modules/', '\\.dto\\.ts$', '\\.module\\.ts$', 'main\\.ts$'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  testTimeout: 10000,
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
};

export default config;

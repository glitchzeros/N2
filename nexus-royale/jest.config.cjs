/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }]
  },
  moduleNameMapper: {
    '^@engine/(.*)$': '<rootDir>/src/engine/$1',
    '^@game/(.*)$': '<rootDir>/src/game/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@content/(.*)$': '<rootDir>/src/content/$1',
    '^@platform/(.*)$': '<rootDir>/src/platform/$1',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: ['src/engine/core/math/**/*.ts'],
  coverageThreshold: {
    global: { branches: 100, functions: 100, lines: 100, statements: 100 }
  }
};

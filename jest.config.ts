import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const nextTransform = {
  '^.+\\.(js|jsx|ts|tsx|mjs)$': require.resolve('next/dist/build/swc/jest-transformer'),
}

const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/__tests__/**/*.spec.ts?(x)'],
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/lib/**/*.test.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      transform: nextTransform,
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/components/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      transform: nextTransform,
    },
  ],
}

export default createJestConfig(config)

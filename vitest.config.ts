import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

// Load root .env file for test environment (since .env.test was empty)
dotenv.config({ path: '.env' })

// Set NODE_ENV to test
process.env.NODE_ENV = 'test'

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
        testTimeout: 10000, // 10 second timeout for all tests
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/**',
                'dist/**',
                'coverage/**',
                '**/*.d.ts',
                'tests/**'
            ]
        },
        setupFiles: ['dotenv/config']
    }
}) 
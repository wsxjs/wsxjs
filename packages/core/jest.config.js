/** @type {import('jest').Config} */
export default {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    roots: ["<rootDir>"],
    testMatch: [
        "<rootDir>/src/**/__tests__/**/*.{ts,tsx}",
        "<rootDir>/src/**/*.test.{ts,tsx}",
        "<rootDir>/src/**/*.spec.{ts,tsx}",
    ],
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
    transform: {
        "^.+\\.(ts|tsx)$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/tsconfig.json",
                useESM: false,
                isolatedModules: false,
            },
        ],
    },
    moduleNameMapper: {
        "^@wsxjs/wsx-core$": "<rootDir>/src",
        "^@wsxjs/wsx-core/(.*)$": "<rootDir>/src/$1",
        "\\.css\\?inline$": "<rootDir>/../../test/__mocks__/styleMock.js",
    },
    setupFilesAfterEnv: ["<rootDir>/../../test/setup.ts"],
    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/**/*.test.{ts,tsx}",
        "!src/**/__tests__/**",
        "!src/**/index.ts",
        "!src/**/types.ts",
    ],
    coverageDirectory: "<rootDir>/coverage",
    coverageReporters: ["text", "lcov", "html", "json", "text-summary"],
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 75,
            lines: 75,
            statements: 75,
        },
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};

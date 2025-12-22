/**
 * Jest setup file for ESLint plugin tests
 */

// Ensure proper error handling in tests
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Promise Rejection:", reason);
    process.exit(1);
});

// Set up global test utilities if needed
global.console = {
    ...console,
    // Uncomment to suppress console.log during tests
    // log: jest.fn(),
    // info: jest.fn(),
    // warn: jest.fn(),
    // error: jest.fn(),
};

// Mock any external dependencies that might not be available during testing
jest.mock("@wsxjs/wsx-core", () => ({
    WebComponent: class WebComponent {},
    autoRegister: jest.fn(),
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

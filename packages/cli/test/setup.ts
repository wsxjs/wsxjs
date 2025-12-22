/**
 * Jest setup file for CLI tests
 * Mocks external dependencies like ink
 */

// Mock ink render
jest.mock("ink", () => ({
    render: jest.fn(() => ({
        unmount: jest.fn(),
    })),
    Box: ({ children }: { children: React.ReactNode }) => children,
    Text: ({ children }: { children: React.ReactNode }) => children,
    Newline: () => null,
}));

// Mock ink-spinner
jest.mock("ink-spinner", () => {
    return jest.fn(() => "⏳");
});

// Mock inquirer
jest.mock("inquirer", () => ({
    prompt: jest.fn(),
}));

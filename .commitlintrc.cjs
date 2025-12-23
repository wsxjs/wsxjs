/**
 * Commitlint Configuration for WSXJS
 *
 * Enforces conventional commit messages to enable semantic versioning
 * and automated changelog generation.
 */

module.exports = {
    extends: ["@commitlint/config-conventional"],

    rules: {
        // Allowed commit types
        "type-enum": [
            2,
            "always",
            [
                "feat", // New features
                "fix", // Bug fixes
                "docs", // Documentation changes
                "style", // Code style changes (formatting, etc.)
                "refactor", // Code refactoring
                "perf", // Performance improvements
                "test", // Adding or updating tests
                "build", // Build system changes
                "ci", // CI/CD changes
                "chore", // Maintenance tasks
                "revert", // Reverting changes
            ],
        ],

        // Allowed scopes (package names)
        "scope-enum": [
            2,
            "always",
            [
                "core", // @wsxjs/wsx-core
                "vite-plugin", // @wsxjs-vite-plugin
                "eslint-plugin", // @wsxjs-eslint-plugin
                "components", // @wsxjs-components
                "site", // @wsxjs-site
                "release", // Release-related changes
                "deps", // Dependency updates
                "config", // Configuration changes
            ],
        ],

        // Subject case - disabled to allow flexible casing
        "subject-case": [0],

        // Subject should not end with period
        "subject-full-stop": [2, "never", "."],

        // Subject should not be empty
        "subject-empty": [2, "never"],

        // Type should be lowercase
        "type-case": [2, "always", "lower-case"],

        // Type should not be empty
        "type-empty": [2, "never"],

        // Header should not be longer than 72 characters
        "header-max-length": [2, "always", 72],

        // Body should wrap at 72 characters
        "body-max-line-length": [2, "always", 72],

        // Footer should wrap at 72 characters
        "footer-max-line-length": [2, "always", 72],
    },
};

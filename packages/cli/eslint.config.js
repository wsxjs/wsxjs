// CLI package uses root ESLint configuration
// This file exists to make ESLint aware of the package structure
import rootConfig from "../../eslint.config.js";

export default [
    ...rootConfig,
    {
        // CLI-specific overrides if needed
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            // Allow console.log in CLI tools
            "no-console": "off",
        },
    },
];

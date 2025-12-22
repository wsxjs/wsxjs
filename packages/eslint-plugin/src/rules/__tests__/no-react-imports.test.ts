/**
 * Tests for no-react-imports rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { noReactImports } from "../no-react-imports";

const ruleTester = new RuleTester({
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
});

ruleTester.run("no-react-imports", noReactImports, {
    valid: [
        // Valid: WSXJS imports
        {
            code: `import { WebComponent, autoRegister } from '@wsxjs/wsx-core';`,
        },
        // Valid: Other non-React imports
        {
            code: `import lodash from 'lodash';`,
        },
        // Valid: No imports
        {
            code: `export class Component {}`,
        },
        // Valid: Import from react-like named modules that aren't React
        {
            code: `import something from 'my-react-wrapper';`,
        },
    ],
    invalid: [
        // Invalid: Direct React import
        {
            code: `import React from 'react';`,
            errors: [
                {
                    messageId: "noReactImport",
                },
            ],
            output: ``, // Rule should remove the import
        },
        // Invalid: React named imports
        {
            code: `import { useState, useEffect } from 'react';`,
            errors: [
                {
                    messageId: "noReactImport",
                },
            ],
            output: ``,
        },
        // Invalid: ReactDOM import
        {
            code: `import ReactDOM from 'react-dom';`,
            errors: [
                {
                    messageId: "noReactImport",
                },
            ],
            output: ``,
        },
        // Invalid: React DOM client import
        {
            code: `import { createRoot } from 'react-dom/client';`,
            errors: [
                {
                    messageId: "noReactImport",
                },
            ],
            output: ``,
        },
        // Invalid: React types import
        {
            code: `import { ComponentType } from '@types/react';`,
            errors: [
                {
                    messageId: "noReactImport",
                },
            ],
            output: ``,
        },
        // Invalid: Multiple React imports in one file
        {
            code: `
        import React from 'react';
        import { render } from 'react-dom';
      `,
            errors: [
                {
                    messageId: "noReactImport",
                },
                {
                    messageId: "noReactImport",
                },
            ],
            output: `
        
        
      `,
        },
    ],
});

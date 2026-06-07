/**
 * Tests for reactive-state-usage rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { reactiveStateUsage } from "../reactive-state-usage";

const ruleTester = new RuleTester({
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
    },
});

ruleTester.run("reactive-state-usage", reactiveStateUsage, {
    valid: [
        {
            code: `
                export class MyComponent extends WebComponent {
                    @state private count = 0;
                    constructor() {
                        super();
                        this.count = 1; // constructor assignment is valid
                    }
                    increment() {
                        this.count++; // state variable update is valid
                    }
                }
            `,
        },
        {
            code: `
                export class MyComponent extends WebComponent {
                    private regularField = "hello";
                    constructor() {
                        super();
                        this.regularField = "world"; // constructor assignment is valid
                    }
                    // No updates to regularField outside constructor
                }
            `,
        },
    ],
    invalid: [
        {
            code: `
                export class MyComponent extends WebComponent {
                    private count = 0; // Not decorated with @state
                    increment() {
                        this.count = this.count + 1; // Warning: direct assignment outside constructor
                    }
                }
            `,
            errors: [
                {
                    messageId: "directPropertyAssignment",
                    data: { propertyName: "count" },
                },
            ],
        },
        {
            code: `
                export class MyComponent extends WebComponent {
                    private count = 0; // Not decorated with @state
                    increment() {
                        this.count++; // Warning: direct update outside constructor
                    }
                }
            `,
            errors: [
                {
                    messageId: "directPropertyAssignment",
                    data: { propertyName: "count" },
                },
            ],
        },
    ],
});

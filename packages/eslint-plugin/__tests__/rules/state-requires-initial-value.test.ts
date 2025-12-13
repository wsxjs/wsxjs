/**
 * Tests for state-requires-initial-value rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { stateRequiresInitialValue } from "../../src/rules/state-requires-initial-value";

const ruleTester = new RuleTester({
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
        experimentalDecorators: true, // Required for @state decorator
    },
});

ruleTester.run("state-requires-initial-value", stateRequiresInitialValue, {
    valid: [
        // Valid: @state with string initial value
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state private maskStrokeColor = "";
        }
      `,
        },
        // Valid: @state with number initial value
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state private count = 0;
        }
      `,
        },
        // Valid: @state with object initial value
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state private user = { name: "John" };
        }
      `,
        },
        // Valid: @state with array initial value
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state private items = [];
        }
      `,
        },
        // Valid: @state with undefined initial value
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state private optional = undefined;
        }
      `,
        },
        // Valid: @state with null initial value
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state private data = null;
        }
      `,
        },
        // Valid: @state with boolean initial value
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state private isOpen = false;
        }
      `,
        },
        // Valid: Property without @state decorator (should be ignored)
        {
            code: `
        class MyComponent extends WebComponent {
          private maskStrokeColor?: string;
        }
      `,
        },
        // Valid: @state with imported alias
        {
            code: `
        import { state as wsxState } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @wsxState private count = 0;
        }
      `,
        },
        // Valid: @state() call expression
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state() private count = 0;
        }
      `,
        },
    ],
    invalid: [
        // Invalid: @state without initial value
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state private maskStrokeColor?: string;
        }
      `,
            errors: [
                {
                    messageId: "missingInitialValue",
                    data: { propertyName: "maskStrokeColor" },
                },
            ],
        },
        // Invalid: @state without initial value (private property)
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state private count;
        }
      `,
            errors: [
                {
                    messageId: "missingInitialValue",
                    data: { propertyName: "count" },
                },
            ],
        },
        // Invalid: @state without initial value (public property)
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state public user;
        }
      `,
            errors: [
                {
                    messageId: "missingInitialValue",
                    data: { propertyName: "user" },
                },
            ],
        },
        // Invalid: @state() call expression without initial value
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state() private items;
        }
      `,
            errors: [
                {
                    messageId: "missingInitialValue",
                    data: { propertyName: "items" },
                },
            ],
        },
        // Invalid: @state with imported alias without initial value
        {
            code: `
        import { state as wsxState } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @wsxState private data;
        }
      `,
            errors: [
                {
                    messageId: "missingInitialValue",
                    data: { propertyName: "data" },
                },
            ],
        },
        // Invalid: Multiple @state properties without initial values
        {
            code: `
        import { state } from "@wsxjs/wsx-core";
        class MyComponent extends WebComponent {
          @state private count;
          @state private name;
        }
      `,
            errors: [
                {
                    messageId: "missingInitialValue",
                    data: { propertyName: "count" },
                },
                {
                    messageId: "missingInitialValue",
                    data: { propertyName: "name" },
                },
            ],
        },
    ],
});

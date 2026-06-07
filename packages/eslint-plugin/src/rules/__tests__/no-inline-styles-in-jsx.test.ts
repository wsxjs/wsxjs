/**
 * Tests for no-inline-styles-in-jsx rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { noInlineStylesInJSX } from "../no-inline-styles-in-jsx";

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

ruleTester.run("no-inline-styles-in-jsx", noInlineStylesInJSX, {
    valid: [
        {
            code: `const element = <div class="btn">Hello</div>;`,
        },
        {
            code: `const element = <span class="text-large">Text</span>;`,
        },
    ],
    invalid: [
        {
            code: `const element = <div style={{ color: 'red' }}>Hello</div>;`,
            errors: [
                {
                    messageId: "noInlineStyle",
                },
            ],
        },
        {
            code: `const element = <span style="color: blue;">Text</span>;`,
            errors: [
                {
                    messageId: "noInlineStyle",
                },
            ],
        },
    ],
});

/**
 * Tests for prefer-class-over-classname rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { preferClassOverClassName } from "../prefer-class-over-classname";

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

ruleTester.run("prefer-class-over-classname", preferClassOverClassName, {
    valid: [
        {
            code: `const element = <div class="btn">Button</div>;`,
        },
        {
            code: `const element = <span class={active ? "show" : "hide"}>Text</span>;`,
        },
    ],
    invalid: [
        {
            code: `const element = <div className="btn">Button</div>;`,
            errors: [
                {
                    messageId: "preferClass",
                },
            ],
            output: `const element = <div class="btn">Button</div>;`,
        },
        {
            code: `const element = <span className={active ? "show" : "hide"}>Text</span>;`,
            errors: [
                {
                    messageId: "preferClass",
                },
            ],
            output: `const element = <span class={active ? "show" : "hide"}>Text</span>;`,
        },
    ],
});

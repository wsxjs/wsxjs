/**
 * Tests for component-base-class rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { componentBaseClass } from "../component-base-class";

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

ruleTester.run("component-base-class", componentBaseClass, {
    valid: [
        {
            code: `
                @autoRegister({ tagName: "my-button" })
                export class MyButton extends WebComponent {}
            `,
        },
        {
            code: `
                @autoRegister()
                export class MyList extends LightComponent {}
            `,
        },
        {
            code: `
                // Normal class, should be ignored since it doesn't have @autoRegister
                export class HTMLElement {}
            `,
        },
    ],
    invalid: [
        {
            code: `
                @autoRegister()
                export class MyButton extends HTMLElement {}
            `,
            errors: [
                {
                    messageId: "invalidBaseClass",
                    data: { componentName: "MyButton" },
                },
            ],
        },
        {
            code: `
                @autoRegister()
                export class MyList {}
            `,
            errors: [
                {
                    messageId: "invalidBaseClass",
                    data: { componentName: "MyList" },
                },
            ],
        },
    ],
});

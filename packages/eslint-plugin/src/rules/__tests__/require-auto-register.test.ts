/**
 * Tests for require-auto-register rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { requireAutoRegister } from "../require-auto-register";

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

ruleTester.run("require-auto-register", requireAutoRegister, {
    valid: [
        {
            code: `
                @autoRegister({ tagName: "my-button" })
                export class MyButton extends WebComponent {
                    render() { return <button>Click</button>; }
                }
            `,
        },
        {
            code: `
                @autoRegister()
                export class MyList extends LightComponent {
                    render() { return <ul></ul>; }
                }
            `,
        },
        {
            code: `
                import { autoRegister as register } from '@wsxjs/wsx-core';
                @register({ tagName: "my-card" })
                export class MyCard extends WebComponent {}
            `,
        },
        {
            code: `
                // Normal class, should be ignored
                export class NormalClass {}
            `,
        },
        {
            code: `
                // Class extending HTMLElement directly is not WSX component, ignored by this rule
                export class RawComponent extends HTMLElement {}
            `,
        },
    ],
    invalid: [
        {
            code: `
                export class MyButton extends WebComponent {
                    render() { return <button>Click</button>; }
                }
            `,
            errors: [
                {
                    messageId: "missingAutoRegister",
                    data: { componentName: "MyButton" },
                },
            ],
        },
        {
            code: `
                export class MyList extends LightComponent {
                    render() { return <ul></ul>; }
                }
            `,
            errors: [
                {
                    messageId: "missingAutoRegister",
                    data: { componentName: "MyList" },
                },
            ],
        },
    ],
});

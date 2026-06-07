/**
 * Tests for lifecycle-hook-naming rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { lifecycleHookNaming } from "../lifecycle-hook-naming";

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

ruleTester.run("lifecycle-hook-naming", lifecycleHookNaming, {
    valid: [
        {
            code: `
                export class MyComponent extends WebComponent {
                    protected onConnected() {}
                    protected onDisconnected() {}
                    protected onRendered() {}
                    protected onAttributeChanged() {}
                }
            `,
        },
        {
            code: `
                // Normal class should be ignored
                export class NormalClass {
                    componentDidMount() {}
                }
            `,
        },
    ],
    invalid: [
        {
            code: `
                export class MyComponent extends WebComponent {
                    componentDidMount() {}
                }
            `,
            errors: [
                {
                    messageId: "useOnConnected",
                    data: { invalidName: "componentDidMount" },
                },
            ],
        },
        {
            code: `
                export class MyComponent extends WebComponent {
                    componentWillUnmount() {}
                }
            `,
            errors: [
                {
                    messageId: "useOnDisconnected",
                    data: { invalidName: "componentWillUnmount" },
                },
            ],
        },
        {
            code: `
                export class MyComponent extends WebComponent {
                    componentDidUpdate() {}
                }
            `,
            errors: [
                {
                    messageId: "useOnRendered",
                    data: { invalidName: "componentDidUpdate" },
                },
            ],
        },
        {
            code: `
                export class MyComponent extends WebComponent {
                    protected onAttributeChange() {}
                }
            `,
            errors: [
                {
                    messageId: "useOnAttributeChanged",
                    data: { invalidName: "onAttributeChange" },
                },
            ],
        },
    ],
});

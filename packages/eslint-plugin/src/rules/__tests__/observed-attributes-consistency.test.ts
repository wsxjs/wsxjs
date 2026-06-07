/**
 * Tests for observed-attributes-consistency rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { observedAttributesConsistency } from "../observed-attributes-consistency";

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

ruleTester.run("observed-attributes-consistency", observedAttributesConsistency, {
    valid: [
        {
            code: `
                export class MyComponent extends WebComponent {
                    static get observedAttributes() {
                        return ["disabled", "loading"];
                    }
                    protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
                        if (name === "disabled") {
                            // handle disabled
                        } else if (name === "loading") {
                            // handle loading
                        }
                    }
                }
            `,
        },
        {
            code: `
                export class MySwitchComponent extends WebComponent {
                    static get observedAttributes() {
                        return ["disabled", "type"];
                    }
                    protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
                        switch (name) {
                            case "disabled":
                                break;
                            case "type":
                                break;
                        }
                    }
                }
            `,
        },
        {
            code: `
                // Normal class, should be ignored
                export class NormalClass {
                    static get observedAttributes() {
                        return ["disabled"];
                    }
                }
            `,
        },
    ],
    invalid: [
        {
            code: `
                export class MyComponent extends WebComponent {
                    static get observedAttributes() {
                        return ["disabled", "loading"];
                    }
                    // Missing onAttributeChanged entirely
                }
            `,
            errors: [
                {
                    messageId: "missingHandlerMethod",
                },
            ],
        },
        {
            code: `
                export class MyComponent extends WebComponent {
                    static get observedAttributes() {
                        return ["disabled", "loading"];
                    }
                    protected onAttributeChanged(name: string, oldValue: string, newValue: string) {
                        if (name === "disabled") {
                            // only handles disabled
                        }
                    }
                }
            `,
            errors: [
                {
                    messageId: "unhandledAttribute",
                    data: { attribute: "loading" },
                },
            ],
        },
    ],
});

/**
 * Tests for web-component-naming rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { webComponentNaming } from "../web-component-naming";

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

ruleTester.run("web-component-naming", webComponentNaming, {
    valid: [
        // Valid: Properly hyphenated custom element name
        {
            code: `
        @autoRegister({ tagName: 'my-component' })
        export class MyComponent extends WebComponent {}
      `,
        },
        // Valid: Multiple hyphens
        {
            code: `
        @autoRegister({ tagName: 'my-awesome-component' })
        export class MyAwesomeComponent extends WebComponent {}
      `,
        },
        // Valid: Framework-style naming
        {
            code: `
        @autoRegister({ tagName: 'wsx-button' })
        export class WSXButton extends WebComponent {}
      `,
        },
        // Valid: No autoRegister decorator (should be ignored)
        {
            code: `
        export class SomeComponent extends WebComponent {}
      `,
        },
        // Valid: autoRegister without tagName option
        {
            code: `
        @autoRegister()
        export class AutoNamedComponent extends WebComponent {}
      `,
        },
    ],
    invalid: [
        // Invalid: Reserved HTML element name
        {
            code: `
        @autoRegister({ tagName: 'button' })
        export class CustomButton extends WebComponent {}
      `,
            errors: [
                {
                    messageId: "tagNameReserved",
                    data: { tagName: "button" },
                },
            ],
        },
        // Invalid: Another reserved element
        {
            code: `
        @autoRegister({ tagName: 'div' })
        export class CustomDiv extends WebComponent {}
      `,
            errors: [
                {
                    messageId: "tagNameReserved",
                    data: { tagName: "div" },
                },
            ],
        },
        // Invalid: No hyphen in custom element name
        {
            code: `
        @autoRegister({ tagName: 'mycomponent' })
        export class MyComponent extends WebComponent {}
      `,
            errors: [
                {
                    messageId: "tagNameNeedsHyphen",
                    data: { tagName: "mycomponent" },
                },
            ],
        },
        // Invalid: Single letter (no hyphen)
        {
            code: `
        @autoRegister({ tagName: 'x' })
        export class X extends WebComponent {}
      `,
            errors: [
                {
                    messageId: "tagNameNeedsHyphen",
                    data: { tagName: "x" },
                },
            ],
        },
        // Invalid: Reserved element that also lacks hyphen
        {
            code: `
        @autoRegister({ tagName: 'span' })
        export class CustomSpan extends WebComponent {}
      `,
            errors: [
                {
                    messageId: "tagNameReserved",
                    data: { tagName: "span" },
                },
            ],
        },
        // Invalid: Header element
        {
            code: `
        @autoRegister({ tagName: 'header' })
        export class CustomHeader extends WebComponent {}
      `,
            errors: [
                {
                    messageId: "tagNameReserved",
                    data: { tagName: "header" },
                },
            ],
        },
    ],
});

/**
 * Tests for render-method-required rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { renderMethodRequired } from "../render-method-required";

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

ruleTester.run("render-method-required", renderMethodRequired, {
    valid: [
        // Valid: Component with render method
        {
            code: `
        @autoRegister()
        export class ValidComponent extends WebComponent {
          render() {
            return <div>Hello</div>;
          }
        }
      `,
        },
        // Valid: Component with render method and other methods
        {
            code: `
        @autoRegister()
        export class ComplexComponent extends WebComponent {
          constructor() {
            super();
          }

          render() {
            return <div>Complex</div>;
          }

          private handleClick() {
            // handler
          }
        }
      `,
        },
        // Valid: Non-WebComponent class (should be ignored)
        {
            code: `
        export class RegularClass {
          // No render method needed
        }
      `,
        },
        // Valid: Class extending other base class
        {
            code: `
        export class OtherComponent extends SomeOtherBase {
          // No render method needed
        }
      `,
        },
    ],
    invalid: [
        // Invalid: WebComponent without render method
        {
            code: `
        @autoRegister()
        export class MissingRender extends WebComponent {
          constructor() {
            super();
          }
        }
      `,
            errors: [
                {
                    messageId: "missingRenderMethod",
                    data: { componentName: "MissingRender" },
                },
            ],
        },
        // Invalid: WebComponent with only abstract render method
        {
            code: `
        @autoRegister()
        export abstract class AbstractComponent extends WebComponent {
          abstract render(): HTMLElement;
        }
      `,
            errors: [
                {
                    messageId: "missingRenderMethod",
                    data: { componentName: "AbstractComponent" },
                },
            ],
        },
        // Invalid: WebComponent with render property but not method
        {
            code: `
        @autoRegister()
        export class InvalidRender extends WebComponent {
          render = () => <div>Not a method</div>;
        }
      `,
            errors: [
                {
                    messageId: "missingRenderMethod",
                    data: { componentName: "InvalidRender" },
                },
            ],
        },
    ],
});

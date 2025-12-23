/**
 * Tests for no-null-render rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { noNullRender } from "../no-null-render";

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

ruleTester.run("no-null-render", noNullRender, {
    valid: [
        // Valid: render() returns valid JSX
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
        // Valid: render() returns empty div
        {
            code: `
        @autoRegister()
        export class EmptyComponent extends LightComponent {
          render() {
            return <div></div>;
          }
        }
      `,
        },
        // Valid: render() with conditional return (but not null)
        {
            code: `
        @autoRegister()
        export class ConditionalComponent extends WebComponent {
          render() {
            if (!this.code) {
              return <div></div>;
            }
            return <div>{this.code}</div>;
          }
        }
      `,
        },
        // Valid: Non-WSX component (should be ignored)
        {
            code: `
        export class RegularClass {
          render() {
            return null;
          }
        }
      `,
        },
        // Valid: Class extending other base class
        {
            code: `
        export class OtherComponent extends SomeOtherBase {
          render() {
            return null;
          }
        }
      `,
        },
    ],
    invalid: [
        // Invalid: render() returns null
        {
            code: `
        @autoRegister()
        export class NullRender extends WebComponent {
          render() {
            return null;
          }
        }
      `,
            errors: [
                {
                    messageId: "nullReturn",
                },
            ],
            output: `
        @autoRegister()
        export class NullRender extends WebComponent {
          render() {
            return <div></div>;
          }
        }
      `,
        },
        // Invalid: render() returns null in LightComponent
        {
            code: `
        @autoRegister()
        export class NullLightRender extends LightComponent {
          render() {
            if (!this.code) {
              return null;
            }
            return <div>{this.code}</div>;
          }
        }
      `,
            errors: [
                {
                    messageId: "nullReturn",
                },
            ],
            output: `
        @autoRegister()
        export class NullLightRender extends LightComponent {
          render() {
            if (!this.code) {
              return <div></div>;
            }
            return <div>{this.code}</div>;
          }
        }
      `,
        },
        // Invalid: render() with multiple return null statements
        {
            code: `
        @autoRegister()
        export class MultipleNull extends WebComponent {
          render() {
            if (condition1) {
              return null;
            }
            if (condition2) {
              return null;
            }
            return <div>Content</div>;
          }
        }
      `,
            errors: [
                {
                    messageId: "nullReturn",
                },
                {
                    messageId: "nullReturn",
                },
            ],
            output: `
        @autoRegister()
        export class MultipleNull extends WebComponent {
          render() {
            if (condition1) {
              return <div></div>;
            }
            if (condition2) {
              return <div></div>;
            }
            return <div>Content</div>;
          }
        }
      `,
        },
    ],
});

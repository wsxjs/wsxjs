/**
 * Integration tests for WSX ESLint Plugin
 * Tests the plugin as a whole and its configuration
 */

import { ESLint } from "eslint";
import wsxPlugin from "../index";

describe("WSX ESLint Plugin Integration", () => {
    let eslint: ESLint;

    beforeEach(() => {
        eslint = new ESLint({
            useEslintrc: false,
            baseConfig: {
                parser: "@typescript-eslint/parser",
                parserOptions: {
                    ecmaVersion: 2020,
                    sourceType: "module",
                    ecmaFeatures: {
                        jsx: true,
                    },
                },
                plugins: ["wsx"],
                rules: {
                    "wsx/render-method-required": "error",
                    "wsx/no-react-imports": "error",
                    "wsx/web-component-naming": "warn",
                },
            },
            plugins: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                wsx: wsxPlugin as any,
            },
        });
    });

    describe("Plugin Structure", () => {
        test("exports correct plugin structure", () => {
            expect(wsxPlugin).toHaveProperty("meta");
            expect(wsxPlugin).toHaveProperty("rules");
            expect(wsxPlugin).toHaveProperty("configs");

            expect(wsxPlugin.meta).toEqual({
                name: "@wsxjs/eslint-plugin-wsx",
                version: "0.0.2",
            });
        });

        test("exports all expected rules", () => {
            const expectedRules = [
                "render-method-required",
                "no-react-imports",
                "web-component-naming",
                "state-requires-initial-value",
                "require-jsx-import-source",
                "no-null-render",
                "no-inner-html",
                "i18n-after-autoregister",
            ];

            expect(Object.keys(wsxPlugin.rules)).toEqual(expectedRules);

            expectedRules.forEach((ruleName) => {
                const rule = wsxPlugin.rules[ruleName];
                expect(rule).toHaveProperty("meta");
                expect(rule).toHaveProperty("create");
                expect(typeof rule.create).toBe("function");
            });
        });

        test("exports recommended config", () => {
            expect(wsxPlugin.configs).toHaveProperty("recommended");
            const config = wsxPlugin.configs.recommended;

            expect(config).toHaveProperty("rules");
            expect(config.rules).toHaveProperty("wsx/render-method-required");
            expect(config.rules).toHaveProperty("wsx/no-react-imports");
            expect(config.rules).toHaveProperty("wsx/web-component-naming");
            expect(config.rules).toHaveProperty("wsx/no-null-render");
        });
    });

    describe("Real World Code Analysis", () => {
        test("validates correct WSX component", async () => {
            const code = `
        import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

        @autoRegister({ tagName: 'my-component' })
        export class MyComponent extends WebComponent {
          render() {
            return <div>Hello World</div>;
          }
        }
      `;

            const results = await eslint.lintText(code, { filePath: "test.wsx" });
            expect(results[0].messages).toHaveLength(0);
        });

        test("catches missing render method", async () => {
            const code = `
        import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

        @autoRegister({ tagName: 'broken-component' })
        export class BrokenComponent extends WebComponent {
          constructor() {
            super();
          }
        }
      `;

            const results = await eslint.lintText(code, { filePath: "test.wsx" });
            expect(results[0].messages).toHaveLength(1);
            expect(results[0].messages[0].ruleId).toBe("wsx/render-method-required");
            expect(results[0].messages[0].severity).toBe(2); // error
        });

        test("catches React imports", async () => {
            const code = `
        import React from 'react';
        import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

        @autoRegister({ tagName: 'react-component' })
        export class ReactComponent extends WebComponent {
          render() {
            return <div>Should not import React</div>;
          }
        }
      `;

            const results = await eslint.lintText(code, { filePath: "test.wsx" });
            expect(results[0].messages).toHaveLength(1);
            expect(results[0].messages[0].ruleId).toBe("wsx/no-react-imports");
            expect(results[0].messages[0].severity).toBe(2); // error
        });

        test("catches invalid tag names", async () => {
            const code = `
        import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

        @autoRegister({ tagName: 'button' })
        export class InvalidComponent extends WebComponent {
          render() {
            return <div>Invalid tag name</div>;
          }
        }
      `;

            const results = await eslint.lintText(code, { filePath: "test.wsx" });
            expect(results[0].messages).toHaveLength(1);
            expect(results[0].messages[0].ruleId).toBe("wsx/web-component-naming");
            expect(results[0].messages[0].severity).toBe(1); // warning
        });

        test("handles complex real-world component", async () => {
            const code = `
        import { WebComponent, autoRegister, createLogger } from '@wsxjs/wsx-core';

        const logger = createLogger('ComplexComponent');

        interface ComponentConfig {
          disabled?: boolean;
          variant?: 'primary' | 'secondary';
        }

        @autoRegister({ tagName: 'complex-component' })
        export class ComplexComponent extends WebComponent {
          private disabled: boolean = false;
          private variant: 'primary' | 'secondary' = 'primary';

          static get observedAttributes(): string[] {
            return ['disabled', 'variant'];
          }

          constructor(config: ComponentConfig = {}) {
            super();
            this.disabled = config.disabled || false;
            this.variant = config.variant || 'primary';
            logger.info('Component initialized');
          }

          render() {
            return (
              <div
                className={\`complex-component \${this.variant} \${this.disabled ? 'disabled' : ''}\`}
                onClick={this.handleClick}
              >
                <slot></slot>
              </div>
            );
          }

          private handleClick = (event: Event) => {
            if (this.disabled) return;
            logger.debug('Component clicked');
            this.dispatchEvent(new CustomEvent('complexclick', {
              detail: { variant: this.variant },
              bubbles: true,
            }));
          };

          protected onConnected(): void {
            logger.info('Component connected');
          }

          protected onDisconnected(): void {
            logger.info('Component disconnected');
          }

          protected onAttributeChanged(name: string, oldValue: string, newValue: string): void {
            switch (name) {
              case 'disabled':
                this.disabled = newValue !== null;
                break;
              case 'variant':
                this.variant = (newValue as 'primary' | 'secondary') || 'primary';
                break;
            }
            this.rerender();
          }
        }
      `;

            const results = await eslint.lintText(code, { filePath: "complex.wsx" });
            expect(results[0].messages).toHaveLength(0);
        });
    });

    describe("File Type Handling", () => {
        test("ignores non-WSX files", async () => {
            const code = `
        // This is a regular TypeScript file
        export class RegularClass {
          // No render method needed
        }
      `;

            const results = await eslint.lintText(code, { filePath: "regular.ts" });
            expect(results[0].messages).toHaveLength(0);
        });

        test("handles .wsx files specifically", async () => {
            const code = `
        import { WebComponent } from '@wsxjs/wsx-core';

        export class WSXComponent extends WebComponent {
          // Missing render method - should be caught
        }
      `;

            const results = await eslint.lintText(code, { filePath: "component.wsx" });
            expect(results[0].messages).toHaveLength(1);
            expect(results[0].messages[0].ruleId).toBe("wsx/render-method-required");
        });
    });
});

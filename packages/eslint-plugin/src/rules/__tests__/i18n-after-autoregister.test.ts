/**
 * Unit tests for i18n-after-autoregister rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { i18nAfterAutoRegister } from "../i18n-after-autoregister";

const ruleTester = new RuleTester({
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
        experimentalDecorators: true, // Required for @i18n decorator
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
ruleTester.run("i18n-after-autoregister", i18nAfterAutoRegister as any, {
    valid: [
        // Correct order: @autoRegister before @i18n
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
                import { i18n } from '@wsxjs/wsx-i18next';

                @autoRegister({ tagName: 'my-component' })
                @i18n('common')
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
        },
        // Only @autoRegister
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

                @autoRegister({ tagName: 'my-component' })
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>Hello</div>;
                    }
                }
            `,
        },
        // Only @i18n
        {
            code: `
                import { WebComponent } from '@wsxjs/wsx-core';
                import { i18n } from '@wsxjs/wsx-i18next';

                @i18n('common')
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
        },
        // No decorators
        {
            code: `
                import { WebComponent } from '@wsxjs/wsx-core';

                export class MyComponent extends WebComponent {
                    render() {
                        return <div>Hello</div>;
                    }
                }
            `,
        },
        // Aliased imports
        {
            code: `
                import { WebComponent, autoRegister as register } from '@wsxjs/wsx-core';
                import { i18n as translate } from '@wsxjs/wsx-i18next';

                @register({ tagName: 'my-component' })
                @translate('common')
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
        },
        // Multiple decorators with correct order
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
                import { i18n } from '@wsxjs/wsx-i18next';

                @autoRegister({ tagName: 'my-component' })
                @i18n('common')
                export default class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
        },
        // ClassExpression (not just ClassDeclaration)
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
                import { i18n } from '@wsxjs/wsx-i18next';

                export const MyComponent = @autoRegister({ tagName: 'my-component' })
                @i18n('common')
                class extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                };
            `,
        },
        // Decorator with call expression (no arguments)
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
                import { i18n } from '@wsxjs/wsx-i18next';

                @autoRegister()
                @i18n()
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
        },
        // Only @autoRegister with call expression
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

                @autoRegister({ tagName: 'my-component' })
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>Hello</div>;
                    }
                }
            `,
        },
        // Only @i18n with call expression
        {
            code: `
                import { WebComponent } from '@wsxjs/wsx-core';
                import { i18n } from '@wsxjs/wsx-i18next';

                @i18n()
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
        },
        // Default import for i18n
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
                import i18n from '@wsxjs/wsx-i18next';

                @autoRegister({ tagName: 'my-component' })
                @i18n('common')
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
        },
    ],
    invalid: [
        // Wrong order: @i18n before @autoRegister
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
                import { i18n } from '@wsxjs/wsx-i18next';

                @i18n('common')
                @autoRegister({ tagName: 'my-component' })
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
            errors: [
                {
                    messageId: "wrongOrder",
                },
            ],
        },
        // Wrong order with aliased imports
        {
            code: `
                import { WebComponent, autoRegister as register } from '@wsxjs/wsx-core';
                import { i18n as translate } from '@wsxjs/wsx-i18next';

                @translate('common')
                @register({ tagName: 'my-component' })
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
            errors: [
                {
                    messageId: "wrongOrder",
                },
            ],
        },
        // Wrong order with call expressions
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
                import { i18n } from '@wsxjs/wsx-i18next';

                @i18n()
                @autoRegister({ tagName: 'my-component' })
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
            errors: [
                {
                    messageId: "wrongOrder",
                },
            ],
        },
        // Wrong order with default import
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
                import i18n from '@wsxjs/wsx-i18next';

                @i18n('common')
                @autoRegister({ tagName: 'my-component' })
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
            errors: [
                {
                    messageId: "wrongOrder",
                },
            ],
        },
        // Wrong order in ClassExpression
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
                import { i18n } from '@wsxjs/wsx-i18next';

                export const MyComponent = @i18n('common')
                @autoRegister({ tagName: 'my-component' })
                class extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                };
            `,
            errors: [
                {
                    messageId: "wrongOrder",
                },
            ],
        },
        // Wrong order with multiple decorators (other decorators in between)
        {
            code: `
                import { WebComponent, autoRegister } from '@wsxjs/wsx-core';
                import { i18n } from '@wsxjs/wsx-i18next';

                @i18n('common')
                @someOtherDecorator()
                @autoRegister({ tagName: 'my-component' })
                export class MyComponent extends WebComponent {
                    render() {
                        return <div>{this.t('hello')}</div>;
                    }
                }
            `,
            errors: [
                {
                    messageId: "wrongOrder",
                },
            ],
        },
    ],
});

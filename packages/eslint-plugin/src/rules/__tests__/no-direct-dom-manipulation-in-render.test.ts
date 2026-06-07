/**
 * Tests for no-direct-dom-manipulation-in-render rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { noDirectDOMManipulationInRender } from "../no-direct-dom-manipulation-in-render";

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

ruleTester.run("no-direct-dom-manipulation-in-render", noDirectDOMManipulationInRender, {
    valid: [
        {
            code: `
                export class MyComponent extends WebComponent {
                    render() {
                        return <div class="btn">Hello</div>;
                    }
                }
            `,
        },
        {
            code: `
                export class MyComponent extends WebComponent {
                    render() {
                        const items = this.list.map(item => <li>{item}</li>);
                        return <ul>{items}</ul>;
                    }
                }
            `,
        },
        {
            code: `
                export class MyComponent extends WebComponent {
                    private setupDOM() {
                        this.appendChild(document.createElement("div")); // valid outside render
                    }
                    render() {
                        return <div>Hello</div>;
                    }
                }
            `,
        },
    ],
    invalid: [
        {
            code: `
                export class MyComponent extends WebComponent {
                    render() {
                        const div = document.createElement("div");
                        this.appendChild(div); // Invalid in render
                        return <div>Hello</div>;
                    }
                }
            `,
            errors: [
                {
                    messageId: "noDirectDOMManipulation",
                },
            ],
        },
        {
            code: `
                export class MyComponent extends WebComponent {
                    render() {
                        this.shadowRoot.innerHTML = "<span>Danger</span>"; // Invalid in render
                        return <div>Hello</div>;
                    }
                }
            `,
            errors: [
                {
                    messageId: "noDirectDOMManipulation",
                },
            ],
        },
        {
            code: `
                export class MyComponent extends WebComponent {
                    render() {
                        const el = this.querySelector(".inner");
                        el.textContent = "Text"; // Invalid in render
                        return <div>Hello</div>;
                    }
                }
            `,
            errors: [
                {
                    messageId: "noDirectDOMManipulation",
                },
            ],
        },
    ],
});

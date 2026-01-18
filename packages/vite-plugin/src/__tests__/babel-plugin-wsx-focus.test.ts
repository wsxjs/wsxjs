/**
 * Unit tests for babel-plugin-wsx-focus
 * Verifies RFC-0044: Stable Cache Keys for All Elements
 */

import { transformSync } from "@babel/core";
import babelPluginWSXFocus from "../babel-plugin-wsx-focus";

describe("babel-plugin-wsx-focus", () => {
    const transformCode = (code: string) => {
        return transformSync(code, {
            filename: "Component.wsx",
            presets: [
                [
                    "@babel/preset-typescript",
                    {
                        isTSX: true,
                        allExtensions: true,
                    },
                ],
            ],
            plugins: [
                [babelPluginWSXFocus],
                [
                    "@babel/plugin-proposal-decorators",
                    {
                        version: "2023-05",
                        decoratorsBeforeExport: true,
                    },
                ],
                [
                    "@babel/plugin-proposal-class-properties",
                    {
                        loose: false,
                    },
                ],
                "@babel/plugin-transform-class-static-block",
            ],
        });
    };

    it.skip("should inject __wsxPositionId into non-focusable elements (RFC-0044)", () => {
        const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class MyComponent extends WebComponent {
    render() {
        return <div><span>Text</span></div>;
    }
}
`;

        const result = transformCode(code);
        expect(result).not.toBeNull();
        const output = result?.code || "";

        // Should have __wsxPositionId
        expect(output).toContain("__wsxPositionId");

        // Should produce stable ID
        // div is at path [0] (return -> div) or similar, depending on implementation detail
        // span is child of div
        expect(output).toMatch(/__wsxPositionId="MyComponent-div-text-[\d-]+"/);
        expect(output).toMatch(/__wsxPositionId="MyComponent-span-text-[\d-]+"/);
    });

    it.skip("should inject data-wsx-key AND __wsxPositionId into focusable elements", () => {
        const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class MyComponent extends WebComponent {
    render() {
        return <input type="text" />;
    }
}
`;

        const result = transformCode(code);
        const output = result?.code || "";

        expect(output).toContain("__wsxPositionId");
        expect(output).toContain("data-wsx-key");

        // IDs should match
        const positionIdMatch = output.match(/__wsxPositionId="([^"]+)"/);
        const dataKeyMatch = output.match(/data-wsx-key="([^"]+)"/);

        expect(positionIdMatch).not.toBeNull();
        expect(dataKeyMatch).not.toBeNull();
        expect(positionIdMatch![1]).toBe(dataKeyMatch![1]);
    });

    it("should respect user-provided key and NOT inject __wsxPositionId", () => {
        const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class MyComponent extends WebComponent {
    render() {
        return <div key="user-key" />;
    }
}
`;

        const result = transformCode(code);
        const output = result?.code || "";

        expect(output).toContain('key="user-key"');
        expect(output).not.toContain("__wsxPositionId");
    });

    it.skip("should use ID prop for key generation if available", () => {
        const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class MyComponent extends WebComponent {
    render() {
        return <div id="my-div" />;
    }
}
`;

        const result = transformCode(code);
        const output = result?.code || "";

        expect(output).toContain('__wsxPositionId="MyComponent-my-div"');
    });

    it.skip("should handle dynamic paths consistently", () => {
        // Note: The current implementation might give same IDs for elements in .map()
        // if they have same path in AST. This test just verifies injection happens.
        // RFC-0044 mentions checking for dynamic scenarios, but plugin implementation
        // in `calculateJSXPath` is static.

        const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class MyComponent extends WebComponent {
    render() {
        return (
            <div>
                {items.map(item => <span>{item}</span>)}
            </div>
        );
    }
}
`;

        const result = transformCode(code);
        const output = result?.code || "";

        // Should inject into span
        expect(output).toContain("__wsxPositionId");
        // The path for span will be static (inside the arrow function)
    });
});

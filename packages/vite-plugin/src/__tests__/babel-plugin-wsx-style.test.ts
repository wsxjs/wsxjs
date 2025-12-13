/**
 * Unit tests for babel-plugin-wsx-style
 */

import { transformSync } from "@babel/core";
import babelPluginWSXStyle from "../babel-plugin-wsx-style";

describe("babel-plugin-wsx-style", () => {
    const transformCode = (
        code: string,
        cssFileExists: boolean = true,
        cssFilePath: string = "./Button.css?inline",
        componentName: string = "Button"
    ) => {
        return transformSync(code, {
            filename: "Button.wsx",
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
                [
                    babelPluginWSXStyle,
                    {
                        cssFileExists,
                        cssFilePath,
                        componentName,
                    },
                ],
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

    describe("CSS import injection", () => {
        it("should inject CSS import when CSS file exists", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class Button extends WebComponent {
    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code);
            expect(result?.code).toBeDefined();
            expect(result?.code).toContain('import styles from "./Button.css?inline"');
        });

        it("should not inject CSS import when CSS file does not exist", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class Button extends WebComponent {
    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code, false);
            expect(result?.code).toBeDefined();
            expect(result?.code).not.toContain("import styles from");
        });

        it("should not inject CSS import when styles are already manually imported", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";
import styles from "./Button.css?inline";

export default class Button extends WebComponent {
    private _autoStyles = styles; // Use styles to prevent Babel from removing it

    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code);
            expect(result?.code).toBeDefined();
            // Program visitor should skip injection when manual import exists
            // Should not inject _autoStyles (ClassDeclaration visitor should skip because it already exists)
            const autoStylesCount = (
                result?.code?.match(/_defineProperty\([^,]+,\s*["']_autoStyles["']/g) || []
            ).length;
            expect(autoStylesCount).toBe(1); // Only the original one, not duplicated
        });

        it("should inject CSS import after existing imports", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";
import { someOther } from "./other";

export default class Button extends WebComponent {
    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code);
            expect(result?.code).toBeDefined();
            const lines = result?.code?.split("\n") || [];
            const stylesImportIndex = lines.findIndex((line) =>
                line.includes('import styles from "./Button.css?inline"')
            );
            const otherImportIndex = lines.findIndex((line) =>
                line.includes("import { someOther }")
            );
            expect(stylesImportIndex).toBeGreaterThan(otherImportIndex);
        });
    });

    describe("_autoStyles class property injection", () => {
        it("should inject _autoStyles property when CSS file exists", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class Button extends WebComponent {
    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code);
            expect(result?.code).toBeDefined();
            // Babel transforms class properties to _defineProperty calls
            expect(result?.code).toMatch(
                /_defineProperty\([^,]+,\s*["']_autoStyles["'],\s*styles\)/
            );
        });

        it("should not inject _autoStyles property when CSS file does not exist", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class Button extends WebComponent {
    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code, false);
            expect(result?.code).toBeDefined();
            expect(result?.code).not.toContain("_autoStyles");
        });

        it("should inject _autoStyles at the beginning of class body", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class Button extends WebComponent {
    private count = 0;

    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code);
            expect(result?.code).toBeDefined();
            const classBodyMatch = result?.code?.match(/class Button[^{]*\{([^}]+)\}/s);
            expect(classBodyMatch).toBeDefined();
            const classBody = classBodyMatch?.[1] || "";
            const autoStylesIndex = classBody.indexOf("_autoStyles");
            const countIndex = classBody.indexOf("count");
            expect(autoStylesIndex).toBeLessThan(countIndex);
        });

        it("should not inject _autoStyles if it already exists", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";
import styles from "./Button.css?inline";

export default class Button extends WebComponent {
    private _autoStyles = styles;

    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code);
            expect(result?.code).toBeDefined();
            // Should not duplicate _autoStyles (should only have one _defineProperty call)
            const autoStylesCount = (
                result?.code?.match(/_defineProperty\([^,]+,\s*["']_autoStyles["']/g) || []
            ).length;
            expect(autoStylesCount).toBe(1);
        });
    });

    describe("integration: both import and property", () => {
        it("should inject both CSS import and _autoStyles property", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class Button extends WebComponent {
    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code);
            expect(result?.code).toBeDefined();
            expect(result?.code).toContain('import styles from "./Button.css?inline"');
            expect(result?.code).toMatch(
                /_defineProperty\([^,]+,\s*["']_autoStyles["'],\s*styles\)/
            );
        });

        it("should work with constructor", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class Button extends WebComponent {
    constructor() {
        super();
    }

    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code);
            expect(result?.code).toBeDefined();
            expect(result?.code).toContain('import styles from "./Button.css?inline"');
            expect(result?.code).toMatch(
                /_defineProperty\([^,]+,\s*["']_autoStyles["'],\s*styles\)/
            );
            expect(result?.code).toContain("constructor()");
        });

        it("should work with @state decorator", () => {
            const code = `
import { WebComponent, state } from "@wsxjs/wsx-core";

export default class Button extends WebComponent {
    @state private count = 0;

    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code);
            expect(result?.code).toBeDefined();
            expect(result?.code).toContain('import styles from "./Button.css?inline"');
            expect(result?.code).toMatch(
                /_defineProperty\([^,]+,\s*["']_autoStyles["'],\s*styles\)/
            );
        });
    });

    describe("edge cases", () => {
        it("should handle class without explicit constructor", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export default class Button extends WebComponent {
    render() {
        return <button>Click me</button>;
    }
}
            `.trim();

            const result = transformCode(code);
            expect(result?.code).toBeDefined();
            expect(result?.code).toMatch(
                /_defineProperty\([^,]+,\s*["']_autoStyles["'],\s*styles\)/
            );
        });

        it("should handle multiple classes in same file", () => {
            const code = `
import { WebComponent } from "@wsxjs/wsx-core";

export class Button extends WebComponent {
    render() {
        return <button>Click me</button>;
    }
}

export class AnotherButton extends WebComponent {
    render() {
        return <button>Another</button>;
    }
}
            `.trim();

            const result = transformCode(code);
            expect(result?.code).toBeDefined();
            // Should inject for both classes
            const autoStylesCount = (
                result?.code?.match(/_defineProperty\([^,]+,\s*["']_autoStyles["']/g) || []
            ).length;
            expect(autoStylesCount).toBe(2);
        });
    });
});

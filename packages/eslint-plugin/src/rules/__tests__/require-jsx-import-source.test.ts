/**
 * Tests for require-jsx-import-source rule
 */

import { RuleTester } from "@typescript-eslint/rule-tester";
import { requireJsxImportSource } from "../require-jsx-import-source";

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

ruleTester.run("require-jsx-import-source", requireJsxImportSource, {
    valid: [
        // Valid: .wsx file with pragma at the top
        {
            filename: "Component.wsx",
            code: `/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class Component extends WebComponent {
    render() {
        return <div>Hello</div>;
    }
}`,
        },
        // Valid: .wsx file with pragma and other comments
        {
            filename: "Component.wsx",
            code: `/** @jsxImportSource @wsxjs/wsx-core */
// Some other comment
import { WebComponent } from '@wsxjs/wsx-core';`,
        },
        // Valid: .wsx file with pragma in different format
        {
            filename: "Component.wsx",
            code: `/** @jsxImportSource @wsxjs/wsx-core */`,
        },
        // Valid: Non-.wsx file (should be ignored)
        {
            filename: "Component.ts",
            code: `import { WebComponent } from '@wsxjs/wsx-core';`,
        },
        // Valid: Non-.wsx file without pragma (should be ignored)
        {
            filename: "Component.tsx",
            code: `export class Component {}`,
        },
        // Valid: .wsx file with pragma but wrong value (rule only checks presence, not value)
        {
            filename: "Component.wsx",
            code: `/** @jsxImportSource react */
import { WebComponent } from '@wsxjs/wsx-core';`,
        },
    ],
    invalid: [
        // Invalid: .wsx file without pragma
        {
            filename: "Component.wsx",
            code: `import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class Component extends WebComponent {
    render() {
        return <div>Hello</div>;
    }
}`,
            errors: [
                {
                    messageId: "missingPragma",
                },
            ],
            output: `/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent, autoRegister } from '@wsxjs/wsx-core';

@autoRegister()
export class Component extends WebComponent {
    render() {
        return <div>Hello</div>;
    }
}`,
        },
        // Invalid: .wsx file with only imports, no pragma
        {
            filename: "Component.wsx",
            code: `import { WebComponent } from '@wsxjs/wsx-core';`,
            errors: [
                {
                    messageId: "missingPragma",
                },
            ],
            output: `/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent } from '@wsxjs/wsx-core';`,
        },
        // Invalid: .wsx file with comments but no pragma
        {
            filename: "Component.wsx",
            code: `// Some comment
import { WebComponent } from '@wsxjs/wsx-core';`,
            errors: [
                {
                    messageId: "missingPragma",
                },
            ],
            output: `/** @jsxImportSource @wsxjs/wsx-core */
// Some comment
import { WebComponent } from '@wsxjs/wsx-core';`,
        },
        // Invalid: Empty .wsx file
        {
            filename: "Empty.wsx",
            code: ``,
            errors: [
                {
                    messageId: "missingPragma",
                },
            ],
            output: `/** @jsxImportSource @wsxjs/wsx-core */
`,
        },
    ],
});

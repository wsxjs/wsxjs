import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import ts from "typescript";
import { createWsxCompilerHost, createWsxProgram } from "../index.js";

function typeCheck(files: string[], options: ts.CompilerOptions): ts.Diagnostic[] {
    const program = createWsxProgram(files, options);
    return Array.from(ts.getPreEmitDiagnostics(program));
}

const baseOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    jsxImportSource: "@wsxjs/wsx-core",
    experimentalDecorators: true,
    useDefineForClassFields: false,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
};

describe("wsx-tsc", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = join(
            tmpdir(),
            `wsx-tsc-test-${Date.now()}-${Math.random().toString(36).slice(7)}`
        );
        mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true });
        }
    });

    describe("CompilerHost: getSourceFile", () => {
        it("应将 .wsx 文件解析为 TSX", () => {
            const wsxFile = join(testDir, "Button.wsx");
            writeFileSync(wsxFile, "const element = <button>Click</button>");
            const host = createWsxCompilerHost(baseOptions);
            const sourceFile = host.getSourceFile(wsxFile, ts.ScriptTarget.ES2020);

            expect(sourceFile?.languageVariant).toBe(ts.LanguageVariant.JSX);
        });

        it("应将 .ts 文件交给默认 CompilerHost", () => {
            const tsFile = join(testDir, "index.ts");
            writeFileSync(tsFile, "export const value = 1");
            const host = createWsxCompilerHost(baseOptions);
            const sourceFile = host.getSourceFile(tsFile, ts.ScriptTarget.ES2020);

            expect(sourceFile?.languageVariant).toBe(ts.LanguageVariant.Standard);
        });

        it("文件不存在时应返回 undefined", () => {
            const host = createWsxCompilerHost(baseOptions);
            const sourceFile = host.getSourceFile(
                join(testDir, "Missing.wsx"),
                ts.ScriptTarget.ES2020
            );

            expect(sourceFile).toBeUndefined();
        });
    });

    describe("正确代码无报错", () => {
        it("合法 .wsx 文件应通过类型检查", () => {
            const wsxFile = join(testDir, "Valid.wsx");
            writeFileSync(
                wsxFile,
                `
const x: number = 42
const greeting: string = 'hello'
export { x, greeting }
`
            );
            const errors = typeCheck([wsxFile], baseOptions).filter(
                (d) => d.category === ts.DiagnosticCategory.Error
            );
            expect(errors).toHaveLength(0);
        });
    });

    describe("类型错误被捕获", () => {
        it("类型不匹配（TS2322）应被报告", () => {
            const wsxFile = join(testDir, "TypeError.wsx");
            writeFileSync(
                wsxFile,
                `
const x: number = "this is a string"
export { x }
`
            );
            const errors = typeCheck([wsxFile], baseOptions).filter(
                (d) => d.category === ts.DiagnosticCategory.Error
            );
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some((d) => d.code === 2322)).toBe(true);
        });

        it("未定义变量应被报告", () => {
            const wsxFile = join(testDir, "UndefinedVar.wsx");
            writeFileSync(
                wsxFile,
                `
const result = undefinedVariable + 1
export { result }
`
            );
            const errors = typeCheck([wsxFile], baseOptions).filter(
                (d) => d.category === ts.DiagnosticCategory.Error
            );
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe("@autoRegister 装饰器无误报", () => {
        it("类装饰器不应触发类型错误", () => {
            const wsxFile = join(testDir, "Decorated.wsx");
            writeFileSync(
                wsxFile,
                `
function autoRegister(config: { tagName: string }) {
    return function(target: any) { return target }
}

@autoRegister({ tagName: 'my-component' })
class MyComponent {
    private count: number = 0

    render(): string {
        return \`count: \${this.count}\`
    }
}

export { MyComponent }
`
            );
            const errors = typeCheck([wsxFile], baseOptions).filter(
                (d) => d.category === ts.DiagnosticCategory.Error
            );
            expect(errors).toHaveLength(0);
        });
    });

    describe("跨文件类型推导", () => {
        it(".ts 文件 import .wsx 导出类型应正确解析", () => {
            const wsxFile = join(testDir, "Button.wsx");
            writeFileSync(
                wsxFile,
                `
export interface ButtonConfig {
    label: string
    disabled?: boolean
}

export function createButton(config: ButtonConfig): string {
    return config.label
}
`
            );
            const tsFile = join(testDir, "main.ts");
            writeFileSync(
                tsFile,
                `
import { createButton } from './Button.wsx'

const result: string = createButton({ label: 'Click me' })
export { result }
`
            );
            const opts = { ...baseOptions, allowImportingTsExtensions: true };
            const errors = typeCheck([wsxFile, tsFile], opts).filter(
                (d) => d.category === ts.DiagnosticCategory.Error
            );
            // 不应有"找不到模块"（TS2307）错误
            const moduleErrors = errors.filter((d) => d.code === 2307);
            expect(moduleErrors).toHaveLength(0);
        });
    });
});

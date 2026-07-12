import ts from "typescript";
import path from "node:path";

const WSX_EXTENSION = ".wsx";

type WsxCompilerOptions = ts.CompilerOptions & {
    allowNonTsExtensions: boolean;
};

function withWsxCompilerOptions(options: ts.CompilerOptions): WsxCompilerOptions {
    return {
        ...options,
        allowNonTsExtensions: true,
    };
}

export function createWsxCompilerHost(options: ts.CompilerOptions): ts.CompilerHost {
    const wsxOptions = withWsxCompilerOptions(options);
    const host = ts.createCompilerHost(wsxOptions);
    const originalGetSourceFile = host.getSourceFile.bind(host);

    host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
        if (!fileName.endsWith(WSX_EXTENSION)) {
            return originalGetSourceFile(
                fileName,
                languageVersion,
                onError,
                shouldCreateNewSourceFile
            );
        }

        const sourceText = host.readFile(fileName);
        if (sourceText === undefined) {
            return undefined;
        }

        return ts.createSourceFile(fileName, sourceText, languageVersion, true, ts.ScriptKind.TSX);
    };

    host.resolveModuleNames = (moduleNames, containingFile) =>
        moduleNames.map((moduleName) => {
            if (moduleName.endsWith(WSX_EXTENSION)) {
                const resolvedFileName = path.resolve(path.dirname(containingFile), moduleName);
                if (host.fileExists(resolvedFileName)) {
                    return {
                        resolvedFileName,
                        extension: ts.Extension.Tsx,
                        isExternalLibraryImport: false,
                    };
                }
            }

            return ts.resolveModuleName(moduleName, containingFile, wsxOptions, host)
                .resolvedModule;
        });

    return host;
}

export function createWsxProgram(rootNames: string[], options: ts.CompilerOptions): ts.Program {
    const wsxOptions = withWsxCompilerOptions(options);
    const host = createWsxCompilerHost(wsxOptions);
    return ts.createProgram(rootNames, wsxOptions, host);
}

export function run(tsconfigPath: string = "tsconfig.json"): void {
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    if (configFile.error) {
        console.error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
        process.exit(1);
    }

    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, process.cwd());

    if (parsed.errors.length > 0) {
        const formatted = ts.formatDiagnosticsWithColorAndContext(parsed.errors, {
            getCurrentDirectory: () => process.cwd(),
            getCanonicalFileName: (f) => f,
            getNewLine: () => "\n",
        });
        process.stderr.write(formatted);
        process.exit(1);
    }

    const wsxFiles = ts.sys.readDirectory(
        process.cwd(),
        [".wsx"],
        parsed.raw?.exclude,
        parsed.raw?.include
    );

    const allFiles = [...parsed.fileNames, ...wsxFiles];

    const program = createWsxProgram(allFiles, parsed.options);
    const diagnostics = ts.getPreEmitDiagnostics(program);

    if (diagnostics.length > 0) {
        const formatted = ts.formatDiagnosticsWithColorAndContext(Array.from(diagnostics), {
            getCurrentDirectory: () => process.cwd(),
            getCanonicalFileName: (fileName) => fileName,
            getNewLine: () => "\n",
        });
        process.stderr.write(formatted);
        process.exit(1);
    }

    console.log("✓ No type errors found.");
}

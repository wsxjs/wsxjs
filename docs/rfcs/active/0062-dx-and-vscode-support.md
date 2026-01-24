---
title: Developer Experience & VS Code Support
status: Proposed
author: WSXJS Team
created: 2026-01-24
---

# RFC 0062: Developer Experience & VS Code Support

## 1. Introduction

Previously, WSX focused on core runtime capabilities. As the framework matures, we must address the Developer Experience (DX), specifically the lack of first-class support in IDEs (VS Code) and the manual configuration often required to make TypeScript and ESLint happy with `.wsx` files.

The current pain points are:
- **VS Code**: `.wsx` files are treated as generic files unless manually associated with `typescriptreact`. Even then, IntelliSense can be spotty.
- **TypeScript**: Users often encounter errors requiring explicit `/** @jsxImportSource @wsxjs/wsx-core */` pragmas despite `tsconfig.json` settings.
- **Scaffolding**: No easy way to start a new project.

## 2. Goals

1.  **VS Code Extension**: Create an official extension to provide syntax highlighting, snippets, and correct language association for `.wsx` files.
2.  **TypeScript Integration**: Eliminate the need for manual `@jsxImportSource` pragmas through better config presets and editor integration.
3.  **CLI Tool**: Introduce `create-wsx-app` for instant, pre-configured project setup.

## 3. Implementation Plan

### 3.1 VS Code Extension (`@wsxjs/vscode-wsx`)

A new package `packages/vscode-extension` will be created.

**Features:**
- **Language Association**: Automatically associate `.wsx` with a custom language ID `wsx` that inherits from `typescriptreact`.
- **Grammar**: Extend TypeScript React grammar to specifically highlight decorators like `@state`, `@autoRegister` as keywords or special entities.
- **Snippets**:
    - `wsx-web`: Scaffold a new WebComponent.
    - `wsx-light`: Scaffold a new LightComponent.
    - `wsx-state`: Scaffold a state property.
- **IntelliSense Custom Data**: Provide HTML custom data for `<my-element>` tags discovered in the workspace.

### 3.2 TypeScript & Config Presets

To solve the `jsxImportSource` issue permanently:

1.  **Shared Configs**: Publish `@wsxjs/tsconfig` and `@wsxjs/eslint-config` packages.
    - Users extends these configs, ensuring `jsxImportSource` and `include` patterns are correct.
2.  **TypeScript Plugin (Optional)**: If standard config isn't enough for the VS Code TS Server to pick up `.wsx` files as JSX, we will investigate a simpler wrapper or strict `files.associations` recommendation in the CLI generator.
    - *Note*: Usually, ensuring the file is included in `tsconfig.json` and having `files.associations` in `.vscode/settings.json` is sufficient. The persistence of the error suggests we need a solid "Verify Setup" command in the extension.

### 3.3 Create WSX App (`@wsxjs/create-wsx-app`)

A CLI tool to scaffold projects using `vite`, `typescript`, and `@wsxjs/*` packages.

```bash
npx create-wsx-app my-app --template [vanilla|router|full]
```

**Templates:**
- **Vanilla**: Minimal setup (Vite + Core).
- **Router**: Includes `@wsxjs/router`.
- **Full**: Includes Router, i18n, and examples.

## 4. Immediate Workaround Verification

For the specific user issue ("typescript didn't recognize it better"), we will verify the `tsconfig.json` in the `site` directory one more time to ensure it strictly includes `.wsx` files and that VS Code is using the workspace TS version.

## 5. Timeline

- **Phase 1**: VS Code Extension (Basic highlighting & snippets) - 2 Days
- **Phase 2**: CLI Tool - 1 Day
- **Phase 3**: Advanced IntelliSense - Future

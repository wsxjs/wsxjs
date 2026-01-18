---
title: WSX Type System Guide
order: 2
category: guide/advanced
description: "This guide details how the `.wsx` file type system works in WSXJS, maintenance methods, and best practices."
---

This guide details how the `.wsx` file type system works in WSXJS, maintenance methods, and best practices.

## Table of Contents

- [Why Does Each Package Need wsx.d.ts?](#why-does-each-package-need-wsxdts)
- [How to Maintain Type Consistency?](#how-to-maintain-type-consistency)
- [Developer Guide](#developer-guide)
- [Troubleshooting](#troubleshooting)

---

## Why Does Each Package Need wsx.d.ts?

### Problem Background

In WSXJS's monorepo structure, multiple packages (`wsx-router`, `base-components`, `examples`, etc.) all contain the same `wsx.d.ts` file, which looks redundant. But this is **required**, not a design flaw.

### TypeScript Module Type Declaration Limitations

**Key Concept**: `declare module "*.wsx"` belongs to **Pattern Ambient Module**.

TypeScript's type resolution mechanism requires:
- **Pattern ambient module declarations must exist in compilation context**
- **Cannot automatically propagate from `node_modules`**
- `compilerOptions.types` field only affects **global types** (like `@types/node`), doesn't affect pattern ambient module declarations

**This means**: Even if `@wsxjs/wsx-core` correctly configures type definitions, other packages cannot automatically "inherit" this module declaration.

### Actual Verification Results

We tried various technical solutions, including:

1. **`typesVersions` field**: TypeScript official type version mapping mechanism
   - **Result**: Partially failed in monorepo
   - `examples` package works, but `wsx-router` and `base-components` fail
   - Inconsistent behavior, unreliable

2. **Triple-slash directives**: `/// <reference types="..." />`
   - **Result**: Technically feasible, but violates modern TypeScript best practices
   - Need to manually add in each file
   - Easy to miss, difficult to maintain

3. **Current solution**: Each package keeps its own `wsx.d.ts`
   - **Result**: Completely stable and reliable
   - Complies with TypeScript design limitations
   - Consistent with mature frameworks like Vue, Svelte

### Industry Best Practices

Mature frameworks all adopt the same solution:

- **Vue.js**: Each package has `shims-vue.d.ts` file
- **Svelte**: Each package has `ambient.d.ts` file
- **Solid.js**: Each package has module declaration file

This proves this is an industry-recognized best practice, not a WSX-specific problem.

### References

- [TypeScript Documentation - Modules Reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [TypeScript Issue #57652 - Monorepo dependency resolution](https://github.com/microsoft/TypeScript/issues/57652)
- [Live types in a TypeScript monorepo](https://colinhacks.com/essays/live-types-typescript-monorepo)

---

## How to Maintain Type Consistency?

Although we must keep duplicate `wsx.d.ts` files, we ensure consistency and zero maintenance cost through automation tools.

### Automatic Synchronization Mechanism

**Core Script**: `scripts/sync-wsx-types.mjs`

This script will:
1. Read standard type definitions from `@wsxjs/wsx-core/types/wsx-types.d.ts`
2. Automatically synchronize to all packages' `wsx.d.ts` files
3. Add "auto-generated" comments to remind developers not to manually edit

**Usage**:

```bash
# Manual synchronization
pnpm sync:types

# View synchronization results
git status
```

### Pre-commit Hook

**Configuration File**: `.husky/pre-commit`

Before each commit, the pre-commit hook will:
1. Automatically run `pnpm sync:types`
2. Add synchronized files to git
3. Ensure all type files in committed code are consistent

**Developers need no action**, the hook automatically handles it.

### CI/CD Verification

**GitHub Actions Configuration**: `.github/workflows/ci.yml`

CI workflow includes type consistency verification:

```yaml
- name: Verify wsx.d.ts files consistency
  run: |
    pnpm sync:types
    git diff --exit-code packages/*/src/types/wsx.d.ts
```

If inconsistency is detected:
- CI will fail
- Prompt developers to run `pnpm sync:types`
- Ensure inconsistent code won't be merged

---

## Developer Guide

### Modifying Type Definitions

**Important**: Only modify `@wsxjs/wsx-core/types/wsx-types.d.ts`, don't modify other packages' `wsx.d.ts`!

**Steps**:

1. Edit `packages/core/types/wsx-types.d.ts`:

```typescript
// Modify module declaration
declare module "*.wsx" {
    import { WebComponent, LightComponent } from "../src/index";
    const Component: new (...args: unknown[]) => WebComponent | LightComponent;
    export default Component;
}
```

2. Run synchronization script:

```bash
pnpm sync:types
```

3. Commit changes:

```bash
git add packages/core/types/wsx-types.d.ts packages/*/src/types/wsx.d.ts
git commit -m "feat: update wsx type definitions"
```

**Note**: If you forget to run `pnpm sync:types`, the pre-commit hook will automatically run it for you.

### Adding New Package

If you create a new package, you need to:

1. **Create types folder**:

```bash
mkdir -p packages/your-new-package/src/types
```

2. **Update synchronization script**, edit `scripts/sync-wsx-types.mjs`:

```javascript
const TARGET_FILES = [
  'packages/wsx-router/src/types/wsx.d.ts',
  'packages/base-components/src/types/wsx.d.ts',
  'packages/examples/src/types/wsx.d.ts',
  'packages/your-new-package/src/types/wsx.d.ts',  // Add this line
];
```

3. **Run synchronization**:

```bash
pnpm sync:types
```

4. **Configure `tsconfig.json`** (if needed):

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core"
  },
  "include": ["src/**/*", "src/types/**/*"]
}
```

### Checking Type Consistency

Manually check if all `wsx.d.ts` files are consistent:

```bash
# Run synchronization
pnpm sync:types

# Check if there are differences
git diff packages/*/src/types/wsx.d.ts
```

If there's no output, all files are consistent.

---

## Troubleshooting

### Problem 1: TypeScript Error `Cannot find module '*.wsx'`

**Symptoms**:

```
error TS2307: Cannot find module './Component.wsx' or its corresponding type declarations.
```

**Cause**: `wsx.d.ts` file is missing or not recognized by TypeScript.

**Solution**:

1. Check if `src/types/wsx.d.ts` exists:

```bash
ls -la packages/your-package/src/types/wsx.d.ts
```

2. If it doesn't exist, run synchronization script:

```bash
pnpm sync:types
```

3. Check `tsconfig.json`'s `include` configuration:

```json
{
  "include": [
    "src/**/*",
    "src/types/**/*"  // Ensure types directory is included
  ]
}
```

4. Restart TypeScript server (VS Code):

- `Cmd+Shift+P` → "TypeScript: Restart TS Server"

### Problem 2: IDE Shows "React is not in scope" Error

**Symptoms**:

Although code compiles, IDE shows red squiggles: `This JSX tag requires 'React' to be in scope`.

**Cause**: IDE's TypeScript service didn't correctly load JSX configuration.

**Solution**:

1. Add JSX pragma at top of `.wsx` files:

```typescript
/** @jsxImportSource @wsxjs/wsx-core */
```

2. Ensure `tsconfig.json` is correctly configured:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@wsxjs/wsx-core"
  }
}
```

3. Restart TypeScript server

### Problem 3: CI Verification Failed "wsx.d.ts files are inconsistent"

**Symptoms**:

CI reports error:
```
Error: wsx.d.ts files are inconsistent
```

**Cause**: A package's `wsx.d.ts` file is inconsistent with other packages.

**Solution**:

1. Run synchronization script locally:

```bash
pnpm sync:types
```

2. Commit changes:

```bash
git add packages/*/src/types/wsx.d.ts
git commit -m "chore: sync wsx.d.ts files"
git push
```

### Problem 4: Pre-commit Hook Not Automatically Running

**Symptoms**:

When committing code, `wsx.d.ts` files are not automatically synchronized.

**Cause**: Husky hooks are not correctly installed.

**Solution**:

1. Reinstall hooks:

```bash
pnpm install
```

2. Manually enable hooks:

```bash
chmod +x .husky/pre-commit
```

3. Test hook:

```bash
git commit -m "test" --allow-empty
```

Should see `pnpm sync:types` automatically run.

### Problem 5: Newly Created Package Cannot Recognize .wsx Files

**Symptoms**:

`.wsx` files in new package cannot be recognized by TypeScript.

**Cause**: New package not added to synchronization script.

**Solution**:

Refer to [Adding New Package](#adding-new-package) section.

---

## Summary

- **Why duplicate?** TypeScript's pattern ambient module declaration limitations, this is a technical necessity
- **How to maintain?** Automatic synchronization script + Pre-commit hook + CI/CD verification
- **Developer experience?** Fully automated, zero manual maintenance cost
- **Can it be improved?** Can migrate to unified configuration after TypeScript improves type system in the future

WSXJS chose engineering pragmatism: acknowledge technical limitations, provide best developer experience through automation tools.

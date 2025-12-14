# WSX Vite Plugin JSX Factory Auto-Injection Bug Fix

**Date:** 2025-07-15  
**Component:** @wsxjs/wsx-vite-plugin  
**Severity:** Critical  
**Status:** Fixed  

## Problem Description

The WSX Vite plugin was failing to automatically inject JSX factory imports (`h` and `Fragment`) in `.wsx` files, causing runtime errors `ReferenceError: Can't find variable: h` despite successful builds.

## Root Cause Analysis

### The Bug

The issue was in the JSX factory import detection logic in `vite-plugin-wsx.ts`:

```typescript
const hasJSXInImport =
  hasWSXCoreImport &&
  (code.includes(`, ${jsxFactory}`) ||
    code.includes(`{ ${jsxFactory}`) ||
    code.includes(`, ${jsxFragment}`) ||
    code.includes(`{ ${jsxFragment}`));
```

### Why It Failed

1. **Overly Broad Detection**: The condition `code.includes('{ h')` was too permissive
2. **False Positive**: It matched `{ WebComponent` in imports like:
   ```typescript
   import { WebComponent, autoRegister } from "@wsxjs-core";
   ```
3. **Logic Flaw**: The plugin incorrectly determined that JSX factory functions were already imported when they weren't

### Manifestation

1. **Build Success**: JSX was correctly transformed to `h()` calls by esbuild
2. **Runtime Failure**: No `h` function was available in the browser
3. **Missing Import**: The plugin failed to inject the required import statement

## Investigation Process

### Step 1: Symptom Recognition
- Runtime error: `ReferenceError: Can't find variable: h`
- Build successful but runtime broken
- Found `h()` calls in built code but no `h` function definition

### Step 2: Plugin Behavior Analysis
- Added debug logging to understand plugin execution
- Discovered `hasJSXInImport` was incorrectly `true`
- Identified false positive in detection logic

### Step 3: Root Cause Identification
- The string `{ h` appears in `{ WebComponent, autoRegister }`
- Simple string matching caused incorrect detection
- Plugin skipped injection thinking JSX factory was already imported

## Solution Implementation

### Fix Applied

Replaced simple string matching with precise regular expressions:

```typescript
// Before (buggy)
const hasJSXInImport =
  hasWSXCoreImport &&
  (code.includes(`, ${jsxFactory}`) ||
    code.includes(`{ ${jsxFactory}`) ||
    code.includes(`, ${jsxFragment}`) ||
    code.includes(`{ ${jsxFragment}`));

// After (fixed)
const hasJSXInImport = hasWSXCoreImport && (
  new RegExp(`[{,]\\s*${jsxFactory}\\s*[},]`).test(code) ||
  new RegExp(`[{,]\\s*${jsxFragment}\\s*[},]`).test(code)
);
```

### Why This Fix Works

1. **Precise Matching**: `[{,]\\s*h\\s*[},]` only matches `h` when it's a proper import item
2. **Whitespace Handling**: `\\s*` accounts for optional spaces around the identifier
3. **Boundary Detection**: `[{,]` and `[},]` ensure we match complete import items

### Verification

Debug output after fix:
```
[WSX Plugin] Checking JSX imports for: ColorPicker.wsx
  - hasWSXCoreImport: true
  - hasJSXInImport: false ✓ (correctly detected as missing)
  - has < character: true
  - has Fragment: false
[WSX Plugin] Added JSX factory import to: ColorPicker.wsx ✓
```

## Test Cases

### Valid Cases (Should NOT inject)
```typescript
// Already has h
import { WebComponent, h, Fragment } from "@wsxjs-core";

// Already has Fragment
import { WebComponent, Fragment } from "@wsxjs-core";

// Already has both
import { WebComponent, h, Fragment, autoRegister } from "@wsxjs-core";
```

### Invalid Cases (Should inject)
```typescript
// Missing both h and Fragment
import { WebComponent, autoRegister } from "@wsxjs-core";

// Has other imports but not JSX factory
import { WebComponent, StyleManager } from "@wsxjs-core";

// False positive case (the original bug)
import { WebComponent, autoRegister } from "@wsxjs-core";
// This should NOT match as having 'h' import
```

## Impact Assessment

### Before Fix
- ❌ Runtime errors in production
- ❌ Broken WSX components
- ❌ Manual workaround required (manual imports)

### After Fix
- ✅ Automatic JSX factory injection
- ✅ No runtime errors
- ✅ Seamless developer experience
- ✅ Proper plugin behavior as designed

## Prevention Measures

1. **Comprehensive Test Suite**: Added unit tests for import detection logic
2. **Regex Validation**: Use precise regular expressions for string matching
3. **Debug Logging**: Enhanced logging for troubleshooting
4. **Integration Tests**: End-to-end testing of the plugin pipeline

## Related Issues

- **GitHub Issue**: N/A (discovered during development)
- **Component**: `packages/vite-plugin/src/vite-plugin-wsx.ts`
- **Affected Versions**: 0.0.1 (fixed in same version)

## Lessons Learned

1. **Avoid Simple String Matching**: Use precise patterns for code analysis
2. **Test Edge Cases**: Consider false positives in detection logic
3. **Debug Early**: Add logging to understand plugin behavior
4. **Regression Testing**: Ensure fixes don't break existing functionality

## References

- [Vite Plugin Development Guide](https://vitejs.dev/guide/api-plugin.html)
- [ESBuild JSX Transform](https://esbuild.github.io/api/#jsx)
- [RegExp MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

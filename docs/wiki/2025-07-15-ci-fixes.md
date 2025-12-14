# CI/CD Fixes and Solutions

## esbuild Version Conflict (Fixed)

### Issue
```
Error: Expected "0.25.6" but got "0.21.5"
at validateBinaryVersion (/home/runner/work/wsx-framework/wsx-framework/node_modules/.pnpm/esbuild@0.25.6/node_modules/esbuild/install.js:136:11)
```

### Root Cause
- Different packages in the monorepo were using different esbuild versions
- `examples` package had `esbuild: ^0.21.0`
- Other dependencies pulled in `esbuild: 0.25.6`
- pnpm couldn't resolve the version conflict in CI environment

### Solution Applied
1. **Updated examples package** esbuild version to `0.25.6`
2. **Added esbuild as root dependency** for version consistency across monorepo
3. **Added pnpm overrides** to force all esbuild to same version
4. **Made esbuild external** in vite-plugin build to prevent bundling
5. **Added esbuild as peer dependency** in vite-plugin
6. **Regenerated lockfile** to remove old esbuild versions

### Files Changed
- `packages/examples/package.json` - Updated esbuild to `0.25.6`
- `package.json` - Added `esbuild: 0.25.6` as dev dependency + pnpm overrides
- `packages/vite-plugin/package.json` - Made esbuild external in build + peer dependency
- `pnpm-lock.yaml` - Regenerated to remove conflicting versions

### Prevention
- **pnpm overrides** ensures all packages use same esbuild version
- **External esbuild** prevents bundling issues in vite-plugin
- **Peer dependency** documents esbuild requirement
- All packages now use esbuild 0.25.6 consistently

## Status Check Names for GitHub Rulesets

### Required Status Checks for Develop Branch
```yaml
- "PR Validation / Validate Commits"
- "PR Validation / Lint"  
- "PR Validation / Type Check"
- "PR Validation / Test"
- "PR Validation / Build"
```

### Required Status Checks for Main Branch
```yaml
- "Release / CI"
- "Release / Build Matrix"
- "Release / Release"
```

### Workflow Job Names
Ensure GitHub Actions job names match the required status checks:

#### pr.yml
```yaml
jobs:
  commitlint:
    name: "Validate Commits"
  lint:
    name: "Lint"
  typecheck:
    name: "Type Check"
  test:
    name: "Test"
  build:
    name: "Build"
```

#### release.yml
```yaml
jobs:
  ci:
    name: "CI"
  build-matrix:
    name: "Build Matrix"
  release:
    name: "Release"
```

## Common CI Issues and Solutions

### 1. Missing NPM Token
**Issue**: `ENOGHTOKEN No GitHub token specified`
**Solution**: Add `NPM_TOKEN` secret in GitHub repository settings

### 2. Coverage Threshold Failure
**Issue**: Coverage below 80% threshold
**Solution**: 
- Add more tests to increase coverage
- Or adjust threshold in workflow if appropriate

### 3. Commitlint Failures
**Issue**: `subject must be lower-case [subject-case]`
**Solution**: Follow conventional commit format:
```bash
# ✅ Correct
git commit -m "feat: implement comprehensive ci/cd pipeline"

# ❌ Incorrect  
git commit -m "feat: Implement comprehensive CI/CD pipeline"
```

### 4. TypeScript Build Errors
**Issue**: Project reference configuration errors
**Solution**: Ensure consistent TypeScript configuration across packages

### 5. pnpm Lockfile Mismatch
**Issue**: `specifiers in the lockfile don't match specs in package.json`
**Solution**: 
- Regenerate lockfile locally: `pnpm install`
- Commit updated `pnpm-lock.yaml`
- CI uses `--frozen-lockfile` by default (which is correct)

### 6. pnpm Cache Issues
**Issue**: Dependency resolution conflicts in CI
**Solution**: 
- Use `pnpm install --frozen-lockfile` in CI
- Clear cache if needed: `pnpm store prune`

## Monitoring and Debugging

### Check CI Status
1. Go to **Actions** tab in GitHub repository
2. Review failed jobs and error messages
3. Check specific step logs for detailed errors

### Local Testing
```bash
# Test CI pipeline locally
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# Test semantic-release
pnpm release:dry

# Test commit message
npx commitlint --from=HEAD~1 --to=HEAD --verbose
```

### Debug Commands
```bash
# Check esbuild versions
pnpm -r list esbuild

# Check dependency conflicts
pnpm why esbuild

# Verify workspace configuration
pnpm list --depth=0

# Test coverage threshold
pnpm test:coverage
```

## Best Practices for CI Stability

1. **Pin major versions** of critical dependencies
2. **Use workspace root** for shared dependencies
3. **Test locally** before pushing to CI
4. **Monitor CI performance** and optimize as needed
5. **Keep workflows simple** and focused
6. **Document fixes** for future reference

## Local vs CI Environment Differences (Fixed)

### TypeScript Implicit Any Errors

**Issue**: 
```
error TS7006: Parameter 'node' implicitly has an 'any' type
error TS7006: Parameter 'prop' implicitly has an 'any' type
```

**Symptoms**:
- ✅ **Local**: TypeScript compilation works fine
- ❌ **CI**: Hard errors prevent build from completing

**Root Cause**:
Different TypeScript strictness settings between environments:

| Setting | Local Environment | CI Environment |
|---------|------------------|----------------|
| `noImplicitAny` | false/lenient | true/strict |
| TypeScript version | IDE version or different | Exact from package-lock |
| Error handling | IDE shows warnings | CLI treats as hard errors |
| Configuration | IDE/workspace overrides | Pure tsconfig.json |

**Solution Applied**:
Added explicit `any` type annotations to ESLint rule parameters:

```typescript
// Before (failed in CI)
Decorator(node) {
ImportDeclaration(node) {  
const hasRenderMethod = node.body.body.some((member) =>
const tagNameProp = args[0].properties.find((prop) =>

// After (works everywhere)
Decorator(node: any) {
ImportDeclaration(node: any) {
const hasRenderMethod = node.body.body.some((member: any) =>
const tagNameProp = args[0].properties.find((prop: any) =>
```

**Why `any` is Appropriate**:
- ESLint rule parameters are inherently dynamic and untyped
- AST nodes have complex union types that vary by context
- ESLint framework doesn't provide strong typing for rule parameters
- Runtime type guards are used for actual type safety

**Files Changed**:
- `packages/eslint-plugin/src/rules/render-method-required.ts`
- `packages/eslint-plugin/src/rules/no-react-imports.ts`  
- `packages/eslint-plugin/src/rules/web-component-naming.ts`

**Prevention**:
- Set `"noImplicitAny": true` in local tsconfig for consistency
- Use `pnpm typecheck` locally before pushing to catch these early
- Consider adding stricter TypeScript settings to pre-commit hooks

## TypeScript Project References Conflicts (Fixed)

### Multiple Configuration Errors

**Issue**:
```
error TS6305: Output file has not been built from source file
error TS6306: Referenced project must have setting "composite": true
error TS6307: File is not listed within the file list of project
error TS6310: Referenced project may not disable emit
```

**Root Cause**:
Conflicting TypeScript configuration between project references and direct includes:

1. **Root config included source files**: `"include": ["packages/*/src/**/*"]`
2. **Root config had project references**: `"references": [...]`  
3. **Same files owned by multiple projects**: Causes ownership conflicts

**Solution Applied**:
Chose **pure monorepo approach** instead of hybrid:

```json
// Root tsconfig.json - removed conflicting settings
{
  "include": ["packages/*/src/**/*"],  // Keep direct includes
  // "references": [...],              // Remove project references
  // "composite": true,                // Remove composite mode
}

// Package tsconfig.json - simplified
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist"
    // "rootDir": "./src",              // Remove rootDir restriction
    // "composite": true,               // Remove composite mode
    // "tsBuildInfoFile": null          // Remove build info
  }
}
```

**Why This Works**:
- **Single ownership**: Each file belongs to one TypeScript project
- **Simpler configuration**: Easier to maintain and debug
- **tsup handles building**: Don't need TypeScript project references for build
- **Suitable for small monorepo**: Our 4-package setup doesn't need incremental builds

## Coverage Upload Issues (Fixed)

### Codecov Integration Removed

**Issue**:
```
[error] None of the following appear to exist as files: ./coverage/coverage-final.json
[error] There was an error running the uploader: Error while cleaning paths. No paths matched existing files!
Error: Codecov: Failed to properly upload: The process '/home/runner/work/_actions/codecov/codecov-action/v3/dist/codecov' failed with exit code 255
```

**Root Cause**:
- User doesn't have access to codecov.io
- Multiple workflows trying to upload coverage
- Codecov expects specific file paths and permissions

**Solution Applied**:
Completely removed codecov integration from CI workflows:

1. **Removed codecov action** from `ci.yml` test job
2. **Removed codecov action** from `pr.yml` test job  
3. **Removed entire coverage-report job** from `pr.yml` that included:
   - `romeovs/lcov-reporter-action` for PR comments
   - Coverage threshold checking with bc calculator
   - Duplicate test coverage runs

**Files Changed**:
- `.github/workflows/ci.yml` - Removed codecov upload action
- `.github/workflows/pr.yml` - Removed codecov action and coverage-report job
- Coverage still generated with `pnpm test:coverage` but not uploaded

**Alternative Coverage Options**:
- Coverage reports still generated locally in `./coverage/` directory
- HTML coverage report available for local development: `./coverage/index.html`
- JSON and LCOV formats still available for other tools if needed
- Could integrate with other coverage services like Coveralls if access available

## Future Improvements

1. **Add pre-commit hooks** for local validation
2. **Implement dependency scanning** for security
3. **Add performance benchmarks** to CI
4. **Monitor bundle size** changes
5. **Add integration tests** for real-world usage
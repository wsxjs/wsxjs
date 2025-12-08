# Release Checklist for Version 0.0.7

## Pre-Release Checklist

### ✅ Code Quality
- [x] All tests passing (225 tests)
- [x] TypeScript compilation successful
- [x] ESLint checks passed
- [x] Code formatted with Prettier
- [x] No breaking changes

### ✅ Version Updates
- [x] Core package version: 0.0.7
- [x] Base components version: 0.0.7
- [x] Vite plugin version: 0.0.7
- [x] ESLint plugin version: 0.0.7
- [x] Router version: 0.0.7
- [x] CHANGELOG.md updated

### ✅ Changes Summary

#### Fixed
1. **LightComponent Style Preservation**
   - Fixed styles being removed during rerender
   - Styles are now correctly recreated and positioned
   - Added 3 comprehensive tests for style preservation

2. **TypeScript Module Resolution**
   - Standardized `.wsx` module type declarations in core package
   - Removed duplicate declarations from examples package
   - Improved type accuracy for WebComponent and LightComponent exports

#### Testing
- Added 3 new tests for style preservation scenarios
- All 225 existing tests continue to pass
- Comprehensive test coverage for LightComponent (44 tests)

### ✅ Git Status
- [x] All changes committed
- [x] Commit messages follow conventional commits format
- [x] Ready for tag creation

## Release Steps

### 1. Create Git Tag
```bash
git tag -a v0.0.7 -m "Release version 0.0.7

- Fix LightComponent style preservation during rerender
- Fix TypeScript .wsx module type declarations
- Add comprehensive style preservation tests"
git push origin v0.0.7
```

### 2. Publish Packages
```bash
# Publish all packages
pnpm -r publish --access public

# Or publish individually:
cd packages/core && pnpm publish --access public
cd packages/base-components && pnpm publish --access public
cd packages/vite-plugin && pnpm publish --access public
cd packages/eslint-plugin && pnpm publish --access public
cd packages/wsx-router && pnpm publish --access public
```

### 3. Verify Publication
- [ ] Check npm registry for all packages
- [ ] Verify version numbers on npm
- [ ] Test installation: `pnpm add @wsxjs/wsx-core@0.0.7`

## Post-Release

### Documentation
- [x] CHANGELOG.md updated
- [ ] GitHub release notes (if applicable)
- [ ] Update any version-specific documentation

### Testing After Release
- [ ] Install from npm in a fresh project
- [ ] Verify all imports work correctly
- [ ] Test style preservation in LightComponent
- [ ] Verify TypeScript types for .wsx files

## Notes

- This is a patch release (0.0.6 → 0.0.7)
- No breaking changes
- All changes are backward compatible
- Focus: Bug fixes and type improvements


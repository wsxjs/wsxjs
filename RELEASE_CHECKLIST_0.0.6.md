# Release Checklist for 0.0.6

## ✅ Pre-Release Checklist

### Version Updates
- [x] Updated root `package.json` to 0.0.6
- [x] Updated `@wsxjs/wsx-core` to 0.0.6
- [x] Updated `@wsxjs/wsx-vite-plugin` to 0.0.6
- [x] Updated `@wsxjs/eslint-plugin-wsx` to 0.0.6
- [x] Updated `@wsxjs/wsx-router` to 0.0.6
- [x] Updated `@wsxjs/wsx-base-components` to 0.0.6

### Documentation
- [x] Updated main CHANGELOG.md
- [x] Updated core package CHANGELOG.md
- [x] Created RELEASE_0.0.6.md
- [x] Created LIGHT_COMPONENT_GUIDE.md
- [x] Updated README.md with component comparison

### Code Quality
- [x] Fixed TypeScript errors
- [x] All packages build successfully
- [x] Type checking passes

### Build Verification
- [x] All packages build without errors
- [x] Build outputs are generated correctly

## 📋 Release Steps

### 1. Final Verification
```bash
# Run tests
pnpm test

# Type check
pnpm typecheck

# Build all packages
pnpm build

# Lint
pnpm lint
```

### 2. Commit Changes
```bash
git add .
git commit -m "chore: prepare 0.0.6 release

- Add ReactiveWebComponent with reactive state management
- Enhance LightComponent with full reactive support
- Add comprehensive LightComponent usage guide
- Update all package versions to 0.0.6
- Fix TypeScript type errors in jsx-factory
- Update documentation and CHANGELOG"
```

### 3. Create Release Tag
```bash
git tag -a v0.0.6 -m "Release 0.0.6: Reactive State System"
```

### 4. Publish to npm
```bash
# Publish all packages
pnpm changeset:publish

# Or publish individually:
cd packages/core && npm publish
cd ../vite-plugin && npm publish
cd ../eslint-plugin && npm publish
cd ../wsx-router && npm publish
cd ../base-components && npm publish
```

### 5. Create GitHub Release
- Go to GitHub Releases
- Create new release with tag `v0.0.6`
- Copy content from `RELEASE_0.0.6.md`
- Mark as latest release

## 📦 Packages to Publish

1. `@wsxjs/wsx-core@0.0.6` - Core framework
2. `@wsxjs/wsx-vite-plugin@0.0.6` - Vite plugin
3. `@wsxjs/eslint-plugin-wsx@0.0.6` - ESLint plugin
4. `@wsxjs/wsx-router@0.0.6` - Router package
5. `@wsxjs/wsx-base-components@0.0.6` - Base components

## 🎯 Key Features in 0.0.6

- ✅ ReactiveWebComponent implementation
- ✅ LightComponent reactive support
- ✅ Independent reactive state system
- ✅ Comprehensive documentation
- ✅ Component comparison guide

## ⚠️ Notes

- All changes are backward compatible
- No breaking changes
- TypeScript errors fixed
- All packages build successfully


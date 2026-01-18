---
title: WSXJS Publishing Guide
order: 4
category: guide/advanced
description: "This guide explains how to publish all WSXJS packages using Turbo and Changesets."
---

This guide explains how to publish all WSXJS packages using Turbo and Changesets.

> **Best Practice**: This publishing workflow follows best practices for open-source npm package publishing, including security checks, dry-run testing, version verification, etc.

## Prerequisites

1. **Install Turbo** (already included in devDependencies)
   ```bash
   pnpm install
   ```

2. **Ensure logged into NPM**
   ```bash
   npm login
   ```

3. **Ensure on main branch and all changes committed**
   ```bash
   git checkout main
   git pull origin main
   ```

## Publishing Workflow

### Method 1: Using Automated Publishing Script (Recommended)

```bash
pnpm release
```

This script automatically executes the following steps:

## Phase 1: Version Management (Optional)

1. ✅ **Check NPM Authentication** - Verify login status and registry configuration
2. ✅ **Check Git Status** - Verify branch, uncommitted changes, unpushed commits
3. ✅ **Check Remote Updates** - Automatically pull latest remote code (recommended)
4. ✅ **Ask for Version Update** - Whether to update version numbers
5. ✅ **Create Changeset** - Automatically create if no changeset exists
6. ✅ **Apply Version Updates** - Use changeset version to update all package versions
7. ✅ **Rebuild** - Rebuild after version update
8. ✅ **Git Commit** - Commit version updates and CHANGELOG
9. ✅ **Create Tag** - Create Git tag (vX.X.X)
10. ✅ **Push to Remote** - Automatically push branch and tags

## Phase 2: Publish to NPM

11. ✅ **Clean Build Artifacts** - Clean old build files
12. ✅ **Install Dependencies** - Use frozen-lockfile to ensure consistency
13. ✅ **Code Quality Checks** - ESLint, Prettier, TypeScript type checking
14. ✅ **Run Tests** - Ensure all tests pass
15. ✅ **Build All Packages** - Use Turbo parallel build (with cache)
16. ✅ **Verify Build Artifacts** - Check all package build outputs
17. ✅ **Display Publish List** - Show packages and versions to be published
18. ✅ **Check Existing Versions** - Avoid duplicate publishing
19. ✅ **Dry-run Test** - Optional, simulate publishing process (recommended)
20. ✅ **Publish to NPM** - Support interactive OTP input (2FA)
21. ✅ **Completion Confirmation** - Display publishing result summary

## Best Practice Features

- 🔒 **Security**: Check NPM authentication, registry configuration
- 🔍 **Verification**: Check if packages already exist, avoid duplicate publishing
- 🧪 **Dry-run**: Simulate before publishing, reduce risk
- 🔄 **Synchronization**: Automatically check and pull remote updates
- 📦 **Transparency**: Display all packages and versions to be published
- 🛡️ **Error Handling**: Comprehensive error messages and recovery suggestions

**Why Use JavaScript Instead of Shell Scripts?**

The publishing script uses Node.js (`.mjs`) implementation and professional CLI libraries:

- ✅ **Cross-platform Compatibility**: Works on Windows, macOS, Linux, no need for Git Bash or WSL
- ✅ **Better Maintainability**: Consistent with project tech stack (TypeScript/JavaScript)
- ✅ **Easier Debugging**: Can use Node.js debugging tools
- ✅ **Better Error Handling**: JavaScript exception handling is more comprehensive
- ✅ **Professional CLI Experience**: Uses the following libraries for better user experience:
  - **chalk** - Colored output, clearer visual feedback
  - **inquirer** - Interactive prompts, friendly user interaction
  - **ora** - Loading animations, show task progress
  - **listr2** - Task list, clearly display execution steps

### Method 2: Manual Publishing Workflow

#### Step 1: Create Changeset

During development, create a changeset for each change:

```bash
pnpm changeset
```

This will guide you to:
- Select packages to publish
- Select version type (patch/minor/major)
- Add change description

#### Step 2: Build and Test

```bash
# Use Turbo to build all packages in parallel (automatically handles dependency order)
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

#### Step 3: Apply Version Updates

```bash
pnpm changeset:version
```

This will:
- Update all package version numbers based on changesets
- Update CHANGELOG.md
- Delete applied changeset files

#### Step 4: Rebuild

Need to rebuild after version update:

```bash
pnpm build
```

#### Step 5: Publish to NPM

```bash
pnpm changeset:publish
```

This will publish all packages with updated versions to NPM.

#### Step 6: Commit and Push

```bash
git add .
git commit -m "chore: release vX.X.X"
git push --follow-tags
```

## Turbo Advantages

After using Turbo, the build process has the following advantages:

### 1. Parallel Build
- Multiple packages can build simultaneously
- Automatically handles dependency order (e.g., core before base-components)

### 2. Smart Caching
- Unchanged packages won't rebuild
- Significantly improves build speed

### 3. Dependency Awareness
- Automatically identifies dependencies between packages
- Ensures correct build order

### 4. Incremental Build
- Only build changed packages and their dependencies
- Use `turbo build --filter=@wsxjs/wsx-core` to build a single package

## Common Commands

### Build Related

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build:filter @wsxjs/wsx-core

# Build development version (with sourcemap)
pnpm build:dev

# Clean all build artifacts
pnpm clean
```

### Code Quality

```bash
# Run lint for all packages
pnpm lint

# Type check all packages
pnpm typecheck

# Format code
pnpm format

# Check code format
pnpm format:check
```

### Changeset Related

```bash
# Create new changeset
pnpm changeset

# View changeset status
pnpm changeset:status

# Apply version updates
pnpm changeset:version

# Publish (dry-run)
pnpm release:dry-run
```

## Publishing Checklist

Before publishing, please confirm:

- [ ] All tests pass (`pnpm test`)
- [ ] Type check passes (`pnpm typecheck`)
- [ ] Code format is correct (`pnpm format:check`)
- [ ] Lint check passes (`pnpm lint`)
- [ ] All packages build successfully (`pnpm build`)
- [ ] Build artifacts exist and are complete
- [ ] Changeset created and clearly described
- [ ] On main branch
- [ ] All changes committed
- [ ] Logged into NPM

## Troubleshooting

### Build Failure

If a package build fails:

1. Check if the package's dependencies are built
2. Clean and rebuild:
   ```bash
   pnpm clean
   pnpm build
   ```

### Version Conflict

If encountering version conflicts:

1. Check if there are unapplied changesets
2. Manually resolve version conflicts
3. Re-run `pnpm changeset:version`

### Publishing Failure

If publishing fails:

1. Check NPM login status: `npm whoami`
2. Check if package name and version already exist
3. Check if you have publishing permissions

## CI/CD Integration

The publishing workflow is integrated into GitHub Actions (`.github/workflows/release.yml`):

- Automatically run CI checks
- Automatically build and test
- Use semantic-release for automatic publishing

## Related Documentation

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Turbo Documentation](https://turbo.build/repo/docs)
- [Semantic Release Configuration](.releaserc.js)

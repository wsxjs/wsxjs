# CI/CD Strategy for WSX Framework

## Overview
This document outlines the Continuous Integration and Continuous Deployment strategy for the WSX Framework monorepo using pnpm workspaces.

## Repository Structure
```
wsx-framework/
├── packages/
│   ├── core/                    # @wsxjs/wsx-core
│   ├── vite-plugin/             # @wsxjs/wsx-vite-plugin  
│   ├── eslint-plugin/           # @wsxjs/eslint-plugin-wsx
│   ├── components/              # @wsxjs/wsx-components
│   └── examples/                # @wsxjs/wsx-examples (private)
```

## Branch Strategy

### Branch Flow
```
feature/xyz → develop → main → NPM Release
```

### Branch Roles
- **`main`** - Production releases only
  - Only accept merges from `develop`
  - Triggers automatic release pipeline
  - Protected branch with required status checks

- **`develop`** - Integration and daily testing
  - Accepts PRs from feature branches
  - Daily CI runs and integration tests
  - Pre-release validation

- **`feature/*`** - Feature development
  - PRs can only target `develop`
  - Must pass CI before merge

## CI Pipeline (Continuous Integration)

### Triggers
- **PR to develop**: Full CI validation + PR checks
- **Push to develop**: CI + daily integration tests
- **Push to main**: Release pipeline

### CI Jobs
1. **Lint** - ESLint + Prettier validation
2. **TypeCheck** - TypeScript compilation
3. **Test** - Jest unit tests with coverage
4. **Build** - Package builds across Node versions (16, 18, 20)
5. **Coverage Report** - Post coverage summary as PR comment

### Quality Gates
- All tests must pass
- Code coverage thresholds met (80% minimum)
- No linting errors
- Successful build on all Node versions
- Commit messages follow conventional commits
- PR approval from code owners

### PR-Specific Checks
- **Status Checks**: All CI jobs must pass before merge
- **Coverage Reporting**: 
  - Coverage summary posted as PR comment
  - Coverage diff showing changes impact
  - Fail PR if coverage drops below threshold
- **Commit Validation**: All commits must follow conventional format
- **Build Artifacts**: Ensure all packages build successfully
- **Dependency Check**: Verify workspace dependencies are valid

## CD Pipeline (Continuous Deployment)

### Release Strategy
- **Synchronized releases**: All packages released together
- **Automatic version bumping**: Based on conventional commits
- **Changelog generation**: Automated from commit messages

### Version Bumping Logic
Based on conventional commits since last release:
- `feat:` → **MINOR** version bump
- `fix:` → **PATCH** version bump  
- `feat!:` or `BREAKING CHANGE:` → **MAJOR** version bump

### Release Process
1. **Analyze commits** since last release
2. **Determine version bump** (patch/minor/major)
3. **Update package.json** versions
4. **Build packages** with new versions
5. **Run full test suite**
6. **Publish to NPM** (all packages)
7. **Create GitHub release** with changelog
8. **Commit version changes** back to main

## Monorepo Considerations

### Package Dependencies
- **Core dependencies**: `@wsxjs/wsx-core` is dependency for other packages
- **Workspace references**: Use `workspace:*` for internal dependencies
- **Synchronized versioning**: All packages bump version together

### Publishing Strategy
- **Batch publishing**: All packages published in single release
- **Dependency coordination**: Ensure internal dependencies are updated
- **NPM registry**: Published to public NPM under `@wsxjs` scope

## Tools and Configuration

### semantic-release for Monorepo
```javascript
// .releaserc.js
module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'pnpm version ${nextRelease.version} --workspaces',
        publishCmd: 'pnpm publish --filter "!@wsxjs/wsx-examples" --access public'
      }
    ],
    '@semantic-release/github',
    '@semantic-release/git'
  ]
};
```

### commitlint Configuration
```javascript
// .commitlintrc.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']
    ],
    'scope-enum': [
      2,
      'always',
      ['core', 'vite-plugin', 'eslint-plugin', 'components', 'examples']
    ]
  }
};
```

### Husky Git Hooks
```json
{
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-commit": "lint-staged"
    }
  }
}
```

## GitHub Actions Workflows

### 1. PR Workflow (.github/workflows/pr.yml)
- **Triggers**: PR to develop (opened, synchronize, reopened)
- **Jobs**: 
  - lint → typecheck → test → build
  - coverage-report (posts PR comment)
  - commitlint (validates commit messages)
- **Required Status Checks**: All jobs must pass
- **Matrix**: Node 16, 18, 20

### 2. CI Workflow (.github/workflows/ci.yml)
- **Triggers**: Push to develop, push to main
- **Jobs**: lint → typecheck → test → build
- **Matrix**: Node 16, 18, 20
- **Coverage**: Upload to codecov

### 3. Release Workflow (.github/workflows/release.yml)
- **Triggers**: Push to main
- **Jobs**: build → test → release
- **Secrets**: NPM_TOKEN, GITHUB_TOKEN
- **Outputs**: GitHub release with changelog

### 4. Coverage Report (.github/workflows/coverage.yml)
- **Triggers**: PR to develop
- **Jobs**: 
  - Generate coverage report
  - Compare with base branch
  - Post detailed comment to PR
- **Tools**: jest-coverage-report-action

## Release Notes Generation

### Changelog Sections
- **Features** (feat:)
- **Bug Fixes** (fix:)
- **Performance** (perf:)
- **Breaking Changes** (BREAKING CHANGE:)

### Example Release Notes
```markdown
# 0.0.2 (2025-01-15)

## Features
- **vite-plugin**: add auto JSX factory injection
- **core**: improve error handling in web components

## Bug Fixes
- **core**: fix adoptedStyleSheets undefined in jsdom

## BREAKING CHANGES
- **core**: remove deprecated logger methods
```

## Security Considerations

### NPM Publishing
- Use NPM_TOKEN with publish permissions
- Publish only from main branch
- Exclude examples package from publishing

### Branch Protection Rules

#### develop branch
- **Require PR reviews**: 1 approval required
- **Required status checks**: 
  - `lint` 
  - `typecheck`
  - `test`
  - `build`
  - `coverage-report`
  - `commitlint`
- **Dismiss stale reviews**: On new commits
- **Restrict pushes**: Only through PRs
- **Up-to-date branch**: Require before merge

#### main branch  
- **Require PR reviews**: 2 approvals required
- **Required status checks**: All CI jobs must pass
- **Restrict pushes**: Only from develop branch
- **Linear history**: Require merge commits
- **Admin enforcement**: Apply to administrators

### PR Requirements Summary
```
PR Requirements for develop:
✅ All CI jobs pass (lint, typecheck, test, build)
✅ Coverage threshold met (80%+)
✅ Conventional commit messages
✅ 1 code review approval
✅ Branch up-to-date with develop
✅ No merge conflicts

PR Requirements for main:
✅ All above requirements
✅ 2 code review approvals
✅ Only from develop branch
✅ All packages build successfully
```

## Monitoring and Maintenance

### Package Health
- Monitor NPM download statistics
- Track GitHub release adoption
- Monitor CI pipeline success rates

### Version Management
- Track breaking changes impact
- Monitor semver compliance
- Maintain changelog accuracy

## Migration Plan

### Phase 1: Setup
1. Install and configure semantic-release
2. Add commitlint and husky hooks
3. Update GitHub Actions workflows

### Phase 2: Validation
1. Test release process on develop
2. Validate commit message enforcement
3. Test monorepo package publishing

### Phase 3: Production
1. Enable branch protection rules
2. Train team on conventional commits
3. Monitor first production releases

## Documentation Updates

### README.md Updates
- Add NPM package badges for all published packages
- Add CI/CD status badges
- Add coverage badge
- Update installation instructions
- Add contributing guidelines with conventional commits
- Add release process documentation

### NPM Badges to Add
```markdown
[![npm version](https://badge.fury.io/js/@wsxjs%2Fwsx-core.svg)](https://badge.fury.io/js/@wsxjs%2Fwsx-core)
[![npm downloads](https://img.shields.io/npm/dm/@wsxjs/wsx-core.svg)](https://www.npmjs.com/package/@wsxjs/wsx-core)
[![CI Status](https://github.com/wsxjs/wsxjs/workflows/CI/badge.svg)](https://github.com/wsxjs/wsxjs/actions)
[![Coverage Status](https://codecov.io/gh/wsxjs/wsxjs/branch/main/graph/badge.svg)](https://codecov.io/gh/wsxjs/wsxjs)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
```

### Package-specific Badges
Each package should have its own badges:
- **@wsxjs/wsx-core**: Version, downloads, size
- **@wsxjs/wsx-vite-plugin**: Version, downloads, vite compatibility
- **@wsxjs/eslint-plugin-wsx**: Version, downloads, eslint compatibility
- **@wsxjs/wsx-components**: Version, downloads, bundle size

## Success Metrics
- **Release Frequency**: Weekly releases from develop merges
- **CI Reliability**: >95% success rate
- **Version Accuracy**: Zero manual version conflicts
- **Team Adoption**: 100% conventional commit compliance
- **NPM Package Health**: Monitor download trends and usage

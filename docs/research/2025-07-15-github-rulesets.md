# GitHub Repository Rulesets Configuration

## Overview

GitHub Repository Rulesets provide a modern way to enforce branch protection and repository policies. They replace the legacy branch protection rules with more flexible and powerful controls.

## Repository Rulesets to Configure

### 1. Main Branch Protection Ruleset

**Target**: `main` branch  
**Enforcement**: Active

#### Rules to Enable:

##### Branch Protection Rules
- **Restrict pushes** - Only allow pushes through pull requests
- **Require pull request** - Require PR before merging
- **Required approvals** - Require 2 code review approvals
- **Dismiss stale reviews** - Dismiss approvals when new commits are pushed
- **Require review from code owners** - If CODEOWNERS file exists

##### Status Check Rules
- **Require status checks to pass** - All CI checks must pass
- **Required status checks**:
  - `ci / lint`
  - `ci / typecheck` 
  - `ci / test`
  - `ci / build`
  - `release / ci`
  - `release / build-matrix`

##### Commit Rules
- **Require signed commits** - Optional but recommended
- **Require linear history** - Prevent merge commits (use squash/rebase)

### 2. Develop Branch Protection Ruleset

**Target**: `develop` branch  
**Enforcement**: Active

#### Rules to Enable:

##### Branch Protection Rules
- **Restrict pushes** - Only allow pushes through pull requests
- **Require pull request** - Require PR before merging
- **Required approvals** - Require 1 code review approval
- **Dismiss stale reviews** - Dismiss approvals when new commits are pushed

##### Status Check Rules
- **Require status checks to pass** - All PR checks must pass
- **Required status checks**:
  - `pr-validation / commitlint`
  - `pr-validation / lint`
  - `pr-validation / typecheck`
  - `pr-validation / test`
  - `pr-validation / build`
  - `pr-validation / coverage-report`

##### Update Requirements
- **Require branches to be up to date** - Must be current with develop before merge

### 3. Feature Branch Ruleset

**Target**: `feature/*` branches  
**Enforcement**: Active

#### Rules to Enable:

##### Branch Creation Rules
- **Restrict branch creation** - Only allow feature branches from develop
- **Branch naming pattern** - Must follow `feature/*` pattern

##### Merge Rules
- **Restrict merge targets** - Feature branches can only merge to develop
- **Delete branch on merge** - Auto-delete feature branches after merge

### 4. Release Branch Ruleset

**Target**: `release/*` branches  
**Enforcement**: Active

#### Rules to Enable:

##### Branch Protection Rules
- **Restrict pushes** - Only allow pushes through pull requests
- **Require pull request** - Require PR before merging
- **Required approvals** - Require 2 code review approvals

##### Merge Rules
- **Restrict merge targets** - Release branches can only merge to main

## Configuration Steps

### 1. Access Repository Rulesets
1. Navigate to your repository: `https://github.com/wsxjs/wsxjs`
2. Go to **Settings** → **Rules** → **Rulesets**
3. Click **New ruleset**

### 2. Create Main Branch Ruleset

```yaml
# Main Branch Ruleset Configuration
name: "Main Branch Protection"
enforcement: "active"
target: "branch"
include:
  - "main"

rules:
  - type: "pull_request"
    parameters:
      required_approving_review_count: 2
      dismiss_stale_reviews_on_push: true
      require_code_owner_review: true
      require_last_push_approval: true
      
  - type: "required_status_checks"
    parameters:
      required_status_checks:
        - context: "ci / lint"
        - context: "ci / typecheck"
        - context: "ci / test"
        - context: "ci / build"
        - context: "release / ci"
        - context: "release / build-matrix"
      strict_required_status_checks_policy: true
      
  - type: "non_fast_forward"
    parameters: {}
    
  - type: "restrict_pushes"
    parameters:
      restrict_pushes_to_admins: false
```

### 3. Create Develop Branch Ruleset

```yaml
# Develop Branch Ruleset Configuration
name: "Develop Branch Protection"
enforcement: "active"
target: "branch"
include:
  - "develop"

rules:
  - type: "pull_request"
    parameters:
      required_approving_review_count: 1
      dismiss_stale_reviews_on_push: true
      require_last_push_approval: true
      
  - type: "required_status_checks"
    parameters:
      required_status_checks:
        - context: "pr-validation / commitlint"
        - context: "pr-validation / lint"
        - context: "pr-validation / typecheck"
        - context: "pr-validation / test"
        - context: "pr-validation / build"
        - context: "pr-validation / coverage-report"
      strict_required_status_checks_policy: true
      
  - type: "restrict_pushes"
    parameters:
      restrict_pushes_to_admins: false
```

### 4. Create Feature Branch Ruleset

```yaml
# Feature Branch Ruleset Configuration
name: "Feature Branch Rules"
enforcement: "active"
target: "branch"
include:
  - "feature/*"

rules:
  - type: "deletion"
    parameters:
      allow_deletion_by_admins: true
      
  - type: "restrict_pushes"
    parameters:
      restrict_pushes_to_admins: false
```

## Bypass Permissions

### Emergency Access
Configure bypass permissions for critical situations:

- **Repository administrators** - Can bypass all rules
- **GitHub Actions** - Can bypass for automated releases
- **Specific users** - Emergency access for critical fixes

### Bypass Configuration
```yaml
bypass_actors:
  - actor_id: 1 # Replace with actual user ID
    actor_type: "User"
    bypass_mode: "always"
  - actor_id: 2 # GitHub Actions app ID
    actor_type: "Integration"
    bypass_mode: "pull_request"
```

## Integration with CI/CD

### Status Check Names
Ensure your GitHub Actions workflow job names match the required status checks:

#### PR Validation Workflow (pr.yml)
```yaml
jobs:
  commitlint:
    name: "Validate Commits"  # Maps to "pr-validation / commitlint"
  lint:
    name: "Lint"            # Maps to "pr-validation / lint"
  typecheck:
    name: "Type Check"      # Maps to "pr-validation / typecheck"
  test:
    name: "Test"            # Maps to "pr-validation / test"
  build:
    name: "Build"           # Maps to "pr-validation / build"
  coverage-report:
    name: "Coverage Report"  # Maps to "pr-validation / coverage-report"
```

#### Release Workflow (release.yml)
```yaml
jobs:
  ci:
    name: "CI"              # Maps to "release / ci"
  build-matrix:
    name: "Build Matrix"    # Maps to "release / build-matrix"
  release:
    name: "Release"         # Maps to "release / release"
```

## Migration from Branch Protection

### Differences from Legacy Branch Protection
- **More granular control** - Fine-tuned rules per branch pattern
- **Better inheritance** - Rules can be inherited and overridden
- **Improved UI** - Better visualization of rule conflicts
- **Enhanced bypass** - More flexible bypass options

### Migration Steps
1. **Document current branch protection rules**
2. **Create equivalent rulesets** using the configurations above
3. **Test rulesets** with a test PR
4. **Enable rulesets** and disable legacy branch protection
5. **Monitor and adjust** as needed

## Best Practices

### Ruleset Organization
- **One ruleset per branch pattern** - Easier to manage
- **Descriptive names** - Clear purpose for each ruleset
- **Consistent enforcement** - Same rules across similar branches

### Testing Rulesets
- **Test with draft PRs** - Validate rules before enforcement
- **Check bypass permissions** - Ensure emergency access works
- **Verify status checks** - Confirm CI integration works

### Monitoring
- **Review rule violations** - Check for bypass usage
- **Update rules as needed** - Adapt to workflow changes
- **Document exceptions** - Record any bypass approvals

## Troubleshooting

### Common Issues

#### Status Check Not Found
- **Cause**: Job name doesn't match required status check
- **Solution**: Update workflow job names or status check names

#### Bypass Not Working
- **Cause**: Incorrect actor ID or type
- **Solution**: Check user/app IDs in repository settings

#### Rules Conflict
- **Cause**: Multiple rulesets targeting same branch
- **Solution**: Consolidate rules or adjust targeting

### Debugging Steps
1. Check **Repository Settings** → **Rules** → **Rulesets**
2. Review **Recent rule evaluations**
3. Verify **Status check names** in Actions
4. Test with **Draft PR** to validate rules

## Summary

Repository Rulesets provide modern, flexible branch protection that integrates perfectly with our CI/CD pipeline. They ensure:

- **Quality gates** - All checks must pass before merge
- **Review requirements** - Appropriate approvals for each branch
- **Automated enforcement** - Consistent rules across all branches
- **Emergency access** - Bypass options for critical situations

Configure these rulesets after pushing your repository to GitHub for complete CI/CD protection.

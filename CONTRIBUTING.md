# Contributing to WSXJS

Thank you for your interest in contributing to WSXJS! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 18+ (recommended)
- pnpm 8+
- Git

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/wsxjs.git
   cd wsxjs
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Verify Setup**
   ```bash
   pnpm build
   pnpm test
   pnpm lint
   ```

## Development Workflow

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Development Commands**
   ```bash
   # Start development with watch mode (all packages)
   pnpm dev

   # Run the examples showcase application
   pnpm --filter @wsxjs/wsx-site dev
   # This starts a local server at http://localhost:5173

   # Run tests continuously
   pnpm test:watch

   # Check code quality
   pnpm lint
   pnpm typecheck
   ```

### Running Examples

The examples package contains a comprehensive showcase of WSXJS features:

```bash
# Start the site development server
cd site
pnpm dev

# Or from the root directory
pnpm --filter @wsxjs/wsx-site dev

# Build the site for production
pnpm --filter @wsxjs/wsx-site build
```

The examples showcase includes:
- Interactive component demos (Button, ColorPicker, ButtonGroup)
- Framework feature explanations
- Live code examples and documentation
- Mobile-responsive design

Visit `http://localhost:5173` to see the interactive examples.

3. **Before Committing**
   ```bash
   # Format code
   pnpm format

   # Fix linting issues
   pnpm lint:fix

   # Run all tests
   pnpm test

   # Ensure everything builds
   pnpm build
   ```

### Pre-commit Hooks

The project uses Husky for pre-commit hooks that automatically:
- Run ESLint with auto-fix
- Format code with Prettier
- Run TypeScript type checking

If pre-commit hooks fail, fix the issues before committing.

## Code Standards

### TypeScript

- Use TypeScript for all new code
- Provide proper type annotations
- Avoid `any` types when possible
- Use strict TypeScript settings

### Code Style

- **Prettier** handles formatting automatically
- **ESLint** enforces code quality rules
- Follow existing patterns in the codebase
- Use meaningful variable and function names

### JSX/WSX Components

```tsx
// Good: Clear, typed component
@autoRegister()
export class MyButton extends WebComponent {
  private isDisabled = false;

  constructor() {
    super({ styles });
  }

  render(): HTMLElement {
    return (
      <button 
        class={`btn ${this.isDisabled ? 'disabled' : ''}`}
        onClick={this.handleClick}
      >
        <slot></slot>
      </button>
    );
  }

  private handleClick = (event: Event): void => {
    if (this.isDisabled) {
      event.preventDefault();
      return;
    }
    // Handle click
  };
}
```

### Testing

- Write tests for new features
- Maintain or improve test coverage
- Use descriptive test names
- Follow existing test patterns

```typescript
describe('MyComponent', () => {
  it('should render with default props', () => {
    // Test implementation
  });

  it('should handle user interactions correctly', () => {
    // Test implementation
  });
});
```

## Project Structure

### Monorepo Organization

```
packages/
├── core/              # Framework core
├── vite-plugin/       # Build tool integration
├── eslint-plugin/     # Code quality rules
├── components/        # Pre-built components
└── examples/          # Demo applications
```

### Adding New Packages

1. Create package directory in `packages/`
2. Add `package.json` with workspace dependencies
3. Update root `tsconfig.json` references
4. Add to main `README.md`

### Core Package Changes

When modifying `@wsxjs/wsx-core`:
- Update exports in `src/index.ts`
- Add tests for new functionality
- Update TypeScript declarations
- Consider backward compatibility

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

### Types
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring without functionality changes
- `test` - Adding or modifying tests
- `chore` - Build process, tooling, dependencies

### Examples
```bash
feat(core): add logging system for components
fix(vite-plugin): resolve .wsx file imports correctly
docs: update installation instructions
test(components): add tests for Button component
chore: update dependencies to latest versions
```

## Pull Request Process

### Before Submitting

1. **Rebase** your branch on latest main
   ```bash
   git checkout main
   git pull origin main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Verify** everything works
   ```bash
   pnpm clean
   pnpm install
   pnpm build
   pnpm test
   pnpm lint
   ```

3. **Update** documentation if needed

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

### Package Publishing

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Publish to npm (maintainers only)

## Getting Help

### Resources

- **Documentation** - Check existing docs first
- **Issues** - Search existing issues
- **Discussions** - Community questions and ideas

### Questions

- **Bug Reports** - Use GitHub Issues with bug template
- **Feature Requests** - Use GitHub Issues with feature template
- **General Questions** - Use GitHub Discussions

### Code Review

- Be constructive and respectful
- Focus on code, not the person
- Explain reasoning behind suggestions
- Acknowledge good work

## Security

For security vulnerabilities:
1. **Do not** open public issues
2. Email maintainers directly
3. Allow time for fixes before disclosure

## Recognition

Contributors are recognized in:
- Git commit history
- Release notes
- Contributors section (major contributions)

Thank you for contributing to WSXJS! 🎉

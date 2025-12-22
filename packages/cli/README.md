# @wsxjs/cli

CLI tool for WSXJS initialization and configuration with beautiful Ink-based UI.

## Installation

```bash
npm install -D @wsxjs/cli
```

## Usage

### Initialize WSXJS

```bash
npx wsx init
```

This command will interactively guide you through setting up WSXJS in your project:

- ✅ Configure TypeScript (`tsconfig.json`)
- ✅ Configure Vite (`vite.config.ts`)
- ✅ Generate `wsx.d.ts` type declarations
- ✅ Configure ESLint with WSX rules

The CLI uses [Ink](https://github.com/vadimdemedes/ink) to provide a beautiful, interactive terminal UI with real-time progress updates.

### Check Configuration

```bash
npx wsx check
```

Check your current WSXJS configuration and get suggestions for improvements.

## Commands

### `wsx init`

Initialize WSXJS in your project with an interactive setup wizard.

**Options:**
- `--skip-tsconfig`: Skip TypeScript configuration
- `--skip-vite`: Skip Vite configuration
- `--skip-eslint`: Skip ESLint configuration
- `--skip-types`: Skip `wsx.d.ts` generation
- `--use-tsconfig-package`: Use `@wsxjs/wsx-tsconfig` package
- `--use-decorators`: Enable decorator support (`@state`)
- `--no-interactive`: Skip interactive prompts (use command-line options only)

**Examples:**

```bash
# Full interactive setup
npx wsx init

# Skip TypeScript config
npx wsx init --skip-tsconfig

# Use @wsxjs/wsx-tsconfig package
npx wsx init --use-tsconfig-package

# Non-interactive mode
npx wsx init --skip-types --skip-eslint --no-interactive
```

### `wsx check`

Check your WSXJS configuration and display any issues or suggestions.

**Example:**

```bash
npx wsx check
```

Output:
```
🔍 WSX Configuration Check

Status:
  wsx.d.ts: ✓ Found
  tsconfig.json: ✓ Valid
  vite.config: ✓ Valid

✅ All checks passed! Your WSX configuration looks good.
```

## Features

### 🎨 Beautiful Terminal UI

The CLI uses [Ink](https://github.com/vadimdemedes/ink) to provide a React-based terminal UI with:
- Real-time progress indicators
- Spinner animations
- Color-coded status messages
- Step-by-step progress tracking

### ⚙️ Smart Configuration

- **TypeScript**: Automatically configures `tsconfig.json` with WSX-compatible settings
- **Vite**: Adds `@wsxjs/wsx-vite-plugin` to your Vite configuration
- **ESLint**: Configures ESLint with WSX-specific rules
- **Type Declarations**: Generates `wsx.d.ts` for `.wsx` file type support

### 🔍 Configuration Validation

The `check` command validates your setup and provides:
- Issue detection
- Actionable suggestions
- Configuration status overview

## Examples

### Basic Setup

```bash
# Install WSXJS packages
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin

# Install CLI tool
npm install -D @wsxjs/cli

# Initialize with interactive UI
npx wsx init
```

### Advanced Setup

```bash
# Use @wsxjs/wsx-tsconfig package
npx wsx init --use-tsconfig-package --use-decorators

# Skip certain configurations
npx wsx init --skip-vite --skip-eslint

# Non-interactive mode
npx wsx init --no-interactive --use-decorators
```

## Architecture

The CLI is built with:
- **[Commander.js](https://github.com/tj/commander.js)**: Command-line interface
- **[Ink](https://github.com/vadimdemedes/ink)**: React for CLI apps
- **[Inquirer](https://github.com/SBoudrias/Inquirer.js)**: Interactive prompts

## License

MIT

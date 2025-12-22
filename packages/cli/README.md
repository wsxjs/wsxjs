# @wsxjs/cli

CLI tool for WSXJS initialization and configuration.

## Installation

```bash
npm install -D @wsxjs/cli
```

## Usage

### Initialize WSXJS

```bash
npx wsx init
```

This command will:
- Create `src/types/wsx.d.ts` file for `.wsx` module type declarations

### Options

```bash
npx wsx init --skip-wsx-types  # Skip wsx.d.ts generation
```

## Commands

### `wsx init`

Initialize WSXJS in your project.

**Options:**
- `--skip-wsx-types`: Skip wsx.d.ts generation

## Examples

### Basic Usage

```bash
# Install WSXJS
npm install @wsxjs/wsx-core @wsxjs/wsx-vite-plugin

# Install CLI tool
npm install -D @wsxjs/cli

# Initialize
npx wsx init
```

## License

MIT

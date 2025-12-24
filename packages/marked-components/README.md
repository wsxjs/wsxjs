# @wsxjs/wsx-marked-components

Markdown rendering components built with WSXJS for the [marked](https://marked.js.org/) library.

## Installation

```bash
pnpm add @wsxjs/wsx-marked-components marked
```

## Components

### Heading

Renders markdown headings (h1-h6) with customizable styling.

**Tag**: `<wsx-marked-heading>`

**Attributes**:
- `level` (number): Heading level (1-6)
- `text` (string): Heading text content

**Example**:
```html
<wsx-marked-heading level="1" text="Hello World"></wsx-marked-heading>
```

### Code

Renders code blocks with syntax highlighting support.

**Tag**: `<wsx-marked-code>`

**Attributes**:
- `code` (string): Code content
- `language` (string): Programming language identifier

**Example**:
```html
<wsx-marked-code code="console.log('Hello');" language="javascript"></wsx-marked-code>
```

### Blockquote

Renders blockquotes with styling.

**Tag**: `<wsx-marked-blockquote>`

**Example**:
```html
<wsx-marked-blockquote>
  <p>This is a quote</p>
</wsx-marked-blockquote>
```

### Paragraph

Renders paragraphs with HTML content support.

**Tag**: `<wsx-marked-paragraph>`

**Attributes**:
- `content` (string): HTML content for the paragraph

**Example**:
```html
<wsx-marked-paragraph content="This is a <strong>paragraph</strong>"></wsx-marked-paragraph>
```

### List

Renders ordered or unordered lists.

**Tag**: `<wsx-marked-list>`

**Attributes**:
- `ordered` (boolean): Whether the list is ordered
- `items` (string): JSON stringified array of HTML item content

**Example**:
```html
<wsx-marked-list ordered="false" items='["Item 1", "Item 2"]'></wsx-marked-list>
```

### Error

Displays error messages during markdown rendering.

**Tag**: `<wsx-marked-error>`

**Attributes**:
- `message` (string): Error message

**Example**:
```html
<wsx-marked-error message="Failed to parse markdown"></wsx-marked-error>
```

### Markdown

A complete markdown renderer component that converts markdown to WSX marked components.

**Tag**: `<wsx-markdown>`

**Attributes**:
- `markdown` (string): Markdown content to render

**Methods**:
- `setCustomRenderers(renderers: CustomRenderers)`: Set custom token renderers
- `getCustomRenderers()`: Get current custom renderers

**Example - Basic Usage**:
```html
<wsx-markdown markdown="# Hello World"></wsx-markdown>
```

**Example - With Custom Renderers**:
```typescript
import { Markdown, type TokenRenderer } from "@wsxjs/wsx-marked-components";
import type { Tokens } from "marked";

const markdown = document.querySelector("wsx-markdown") as Markdown;

const customHeadingRenderer: TokenRenderer = (token, defaultRender) => {
    if (token.type === "heading") {
        const headingToken = token as Tokens.Heading;
        // Custom rendering logic
        const customElement = document.createElement("div");
        customElement.className = "custom-heading";
        customElement.textContent = `Custom: ${headingToken.text}`;
        return customElement;
    }
    return null; // Use default for other types
};

markdown.setCustomRenderers({
    heading: customHeadingRenderer,
});
```

## Utilities

### `extractInlineTokens(tokens: Tokens.Generic[]): Tokens.Generic[]`

Extracts inline tokens from a list of tokens, handling paragraph tokens by extracting their inline tokens.

### `renderInlineTokens(tokens: Tokens.Generic[]): string`

Renders inline tokens to HTML string.

### `escapeHtml(text: string): string`

Escapes HTML special characters for safe attribute values.

## Usage

### Using Individual Components

```typescript
import "@wsxjs/wsx-marked-components";
import { marked } from "marked";

// Components are automatically registered as custom elements
// You can use them in HTML strings or JSX
const html = marked.parse("# Hello World");
// Returns: '<wsx-marked-heading level="1" text="Hello World"></wsx-marked-heading>'

// Or with code block:
const codeHtml = marked.parse("```js\nconsole.log('Hello');\n```");
// Returns: '<wsx-marked-code code="console.log(\'Hello\');" language="js"></wsx-marked-code>'
```

### Using Markdown Component

The `Markdown` component provides a complete solution for rendering markdown:

```html
<!-- Simple usage -->
<wsx-markdown markdown="# Hello World"></wsx-markdown>

<!-- With custom renderers -->
<script type="module">
import { Markdown, type TokenRenderer } from "@wsxjs/wsx-marked-components";
import type { Tokens } from "marked";

const markdown = document.querySelector("wsx-markdown");
const customRenderer: TokenRenderer = (token, defaultRender) => {
    // Your custom logic here
    return defaultRender();
};
markdown.setCustomRenderers({ heading: customRenderer });
</script>
```

### Customization

The `Markdown` component is designed to be extensible. You can customize rendering for any token type:

```typescript
import { Markdown, type TokenRenderer, type CustomRenderers } from "@wsxjs/wsx-marked-components";
import type { Tokens } from "marked";

const markdown = document.querySelector("wsx-markdown") as Markdown;

// Custom renderers can override default behavior
const customRenderers: CustomRenderers = {
    heading: (token, defaultRender) => {
        // Custom heading rendering
        return defaultRender();
    },
    code: (token, defaultRender) => {
        // Custom code block rendering
        return defaultRender();
    },
};

markdown.setCustomRenderers(customRenderers);
```

## License

MIT


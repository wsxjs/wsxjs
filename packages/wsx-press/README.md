# @wsxjs/wsx-press

A VitePress-like documentation system built with WSXJS.

## Features

- Markdown-based documentation with frontmatter support
- Auto-generated Table of Contents (TOC)
- Full-text search with Fuse.js
- API documentation generation with TypeDoc
- Responsive layout components
- Anchor scrolling with Unicode support (Chinese, etc.)

## Installation

```bash
pnpm add @wsxjs/wsx-press
```

## Quick Start

### 1. Configure Vite Plugin

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { wsxPress } from "@wsxjs/wsx-press/node";

export default defineConfig({
    plugins: [
        wsxPress({
            docsRoot: "./docs",           // Markdown files directory
            outputDir: ".wsx-press",      // Generated data output (optional)
            api: {                        // TypeDoc config (optional)
                entryPoints: ["./src/index.ts"],
                outputDir: "./docs/api",
            },
        }),
    ],
});
```

### 2. Import Client Components

```typescript
// main.ts
import "@wsxjs/wsx-press/client";
```

### 3. Use Components in HTML

```html
<wsx-doc-layout>
    <wsx-doc-sidebar slot="sidebar"></wsx-doc-sidebar>
    <wsx-doc-page slot="content"></wsx-doc-page>
    <wsx-doc-toc slot="toc"></wsx-doc-toc>
</wsx-doc-layout>
```

## Components

### `<wsx-doc-layout>`

Main layout component with sidebar, content, and TOC slots.

```html
<wsx-doc-layout>
    <wsx-doc-sidebar slot="sidebar"></wsx-doc-sidebar>
    <wsx-doc-page slot="content"></wsx-doc-page>
    <wsx-doc-toc slot="toc"></wsx-doc-toc>
</wsx-doc-layout>
```

### `<wsx-doc-page>`

Loads and renders markdown documentation based on current route.

```html
<wsx-doc-page></wsx-doc-page>
```

**Features:**
- Auto-loads markdown from `/docs/{path}.md`
- Renders frontmatter metadata (title, description)
- Supports anchor scrolling with hash URLs

### `<wsx-doc-sidebar>`

Navigation sidebar with document hierarchy.

```html
<wsx-doc-sidebar></wsx-doc-sidebar>
```

**Features:**
- Groups documents by category
- Highlights active document
- Supports ordering via frontmatter `order` field

### `<wsx-doc-toc>`

Table of Contents showing current document headings.

```html
<wsx-doc-toc></wsx-doc-toc>
```

**Features:**
- Auto-generated from document headings
- Click to scroll to heading
- Highlights currently visible heading

### `<wsx-doc-search>`

Full-text search component.

```html
<wsx-doc-search></wsx-doc-search>
```

**Features:**
- Fuzzy search with Fuse.js
- Searches title, content, and category
- Keyboard navigation support

## Customization

### Custom Styles

Each component has its own CSS file that can be overridden:

```css
/* Override DocPage styles */
.doc-page {
    max-width: 900px;
}

.doc-title {
    color: var(--primary-color);
}

/* Override DocTOC styles */
.doc-toc {
    position: sticky;
    top: 80px;
}

.doc-toc-link.active {
    color: var(--accent-color);
    border-left-color: var(--accent-color);
}

/* Override DocSidebar styles */
.doc-sidebar {
    width: 280px;
}

.doc-sidebar-link.active {
    background: var(--highlight-bg);
}
```

### CSS Variables

Define these CSS variables to customize the theme:

```css
:root {
    --primary-color: #3498db;
    --accent-color: #2ecc71;
    --text-color: #333;
    --bg-color: #fff;
    --border-color: #eee;
    --highlight-bg: rgba(52, 152, 219, 0.1);
}
```

### Extend Components

Import and extend the base components:

```typescript
import { DocPage } from "@wsxjs/wsx-press/client";
import { LightComponent, autoRegister, state } from "@wsxjs/wsx-core";

@autoRegister({ tagName: "my-doc-page" })
class MyDocPage extends DocPage {
    // Override methods or add new functionality
    protected updated() {
        super.updated();
        // Custom logic after render
    }
}
```

### Custom TOC ID Generation

The TOC uses a consistent ID generation algorithm across server and client:

```typescript
function generateId(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, "-")           // Spaces to hyphens
        .replace(/[^\p{L}\p{N}\-]/gu, "") // Keep letters, numbers, hyphens (Unicode)
        .replace(/-+/g, "-")            // Merge multiple hyphens
        .replace(/^-+|-+$/g, "");       // Trim edge hyphens
}
```

This algorithm supports:
- Chinese characters: `基本配置` → `基本配置`
- Mixed content: `3. ESLint 配置` → `3-eslint-配置`
- ASCII text: `Getting Started` → `getting-started`

## Document Structure

### Frontmatter

```markdown
---
title: Getting Started
category: Guide
description: Learn how to get started with WSXJS
order: 1
tags:
  - tutorial
  - beginner
---

# Getting Started

Your content here...
```

### Supported Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Document title |
| `category` | string | Category for sidebar grouping |
| `description` | string | Short description |
| `order` | number | Sort order (lower = first) |
| `tags` | string[] | Tags for search/filtering |

## Generated Files

The plugin generates these files in the output directory:

| File | Description |
|------|-------------|
| `docs-meta.json` | Document metadata (title, category, route, etc.) |
| `docs-toc.json` | Table of contents for each document |
| `search-index.json` | Search index for Fuse.js |

## API Reference

### Node.js Utilities

```typescript
import {
    wsxPress,           // Vite plugin
    scanDocsMetadata,   // Scan docs directory
    generateSearchIndex, // Generate search index
    generateApiDocs,    // Generate TypeDoc API docs
} from "@wsxjs/wsx-press/node";
```

### Client Components

```typescript
import {
    DocPage,
    DocLayout,
    DocSidebar,
    DocTOC,
    DocSearch,
} from "@wsxjs/wsx-press/client";
```

### Types

```typescript
import type {
    DocMetadata,
    DocsMetaCollection,
    SearchDocument,
    SearchResult,
    SearchIndex,
    TOCItem,
    LoadingState,
} from "@wsxjs/wsx-press";
```

## License

MIT

---
title: DOM Cache and Key Best Practices
order: 1
category: guide/advanced
description: "WSXJS uses DOM caching mechanism to optimize rendering performance and avoid unnecessary DOM element reconstruction"
---

## Overview

WSXJS uses DOM caching mechanism to optimize rendering performance and avoid unnecessary DOM element reconstruction. Understanding how to correctly use the `key` attribute is crucial for ensuring application correctness and performance.

## Core Concepts

### What is DOM Cache?

DOM cache is a performance optimization technique that:
- **Reuses existing DOM elements** instead of destroying and rebuilding
- **Only updates changed attributes and child elements**
- **Identifies and matches elements through cache key**

### Cache Key Composition

WSXJS automatically generated cache key format:
```
${componentId}:${tag}:${identifier}
```

Where `identifier` can be:
- User-provided `key` attribute value
- Array index `index`
- Auto-generated position ID

## ⚠️ Key Rule: Avoid Duplicate Keys

**The same `key` cannot be used in different parent containers!**

### Why?

When the same key appears in different parent containers:
1. DOM elements will be **incorrectly shared**
2. `appendChild` will **automatically move elements** from old parent container to new parent container
3. Causes elements to appear in **wrong positions**

### Problem Example ❌

```tsx
class BadExample extends BaseComponent {
    render() {
        const items = [0, 1, 2, 3, 4];
        const visibleItems = items.slice(0, 3);
        const overflowItems = items.slice(3);

        return (
            <div>
                {/* Navigation menu */}
                <nav class="nav-menu">
                    {visibleItems.map((item, index) => (
                        <wsx-link key={index}>Item {item}</wsx-link>
                        {/* ❌ Wrong: Using key={index} */}
                    ))}
                </nav>

                {/* Overflow menu */}
                <div class="overflow-menu">
                    {overflowItems.map((item, index) => (
                        <wsx-link key={index}>Item {item}</wsx-link>
                        {/* ❌ Wrong: Using key={index}, conflicts with nav-menu! */}
                    ))}
                </div>
            </div>
        );
    }
}
```

**Problem**: `key={0}` in `overflow-menu` conflicts with `key={0}` in `nav-menu`, causing elements to be incorrectly moved.

### Correct Solution ✅

```tsx
class GoodExample extends BaseComponent {
    render() {
        const items = [0, 1, 2, 3, 4];
        const visibleItems = items.slice(0, 3);
        const overflowItems = items.slice(3);

        return (
            <div>
                {/* Navigation menu */}
                <nav class="nav-menu">
                    {visibleItems.map((item, index) => (
                        <wsx-link key={`nav-${index}`}>Item {item}</wsx-link>
                        {/* ✅ Correct: Using unique prefix "nav-" */}
                    ))}
                </nav>

                {/* Overflow menu */}
                <div class="overflow-menu">
                    {overflowItems.map((item, index) => (
                        <wsx-link key={`overflow-${index}`}>Item {item}</wsx-link>
                        {/* ✅ Correct: Using unique prefix "overflow-" */}
                    ))}
                </div>
            </div>
        );
    }
}
```

## Best Practices

### 1. Use Different Key Prefixes for Different Locations

```tsx
// ✅ Recommended
<wsx-link key={`nav-${index}`}>Navigation</wsx-link>
<wsx-link key={`sidebar-${index}`}>Sidebar</wsx-link>
<wsx-link key={`footer-${index}`}>Footer</wsx-link>
```

### 2. Keep Key Consistency in Conditional Rendering

```tsx
class ConditionalRender extends BaseComponent {
    render() {
        const showMenu = this.state.isOpen;

        return (
            <div>
                {showMenu ? (
                    <nav>
                        {items.map(item => (
                            <wsx-link key={`menu-${item.id}`}>
                                {/* ✅ Use stable ID */}
                                {item.name}
                            </wsx-link>
                        ))}
                    </nav>
                ) : null}
            </div>
        );
    }
}
```

### 3. Use Semantic Prefixes for Dynamic Containers

```tsx
class DynamicContainers extends BaseComponent {
    render() {
        return (
            <div>
                {categories.map(category => (
                    <section key={category.id}>
                        {category.items.map(item => (
                            <wsx-link key={`${category.id}-${item.id}`}>
                                {/* ✅ Combine parent container ID */}
                                {item.name}
                            </wsx-link>
                        ))}
                    </section>
                ))}
            </div>
        );
    }
}
```

### 4. Use Unique Identifiers for List Items

```tsx
// ✅ Recommended: Use unique ID
items.map(item => <wsx-link key={item.id}>{item.name}</wsx-link>)

// ⚠️ Acceptable: If you ensure the same index won't be used elsewhere
items.map((item, index) => <wsx-link key={`list-${index}`}>{item.name}</wsx-link>)

// ❌ Avoid: Pure index, easily conflicts in multiple lists
items.map((item, index) => <wsx-link key={index}>{item.name}</wsx-link>)
```

## Runtime Warnings

WSXJS automatically detects duplicate key issues and outputs warnings in the console:

```
[DOMCacheManager] Duplicate key "0" detected in different parent containers!
  Previous parent: nav.nav-menu
  Current parent:  div.overflow-menu

This may cause elements to appear in wrong containers or be moved unexpectedly.

Solution: Use unique key prefixes for different locations:
  Example: <wsx-link key="nav-0"> vs <wsx-link key="overflow-0">

See https://wsxjs.dev/docs/guide/DOM_CACHE_GUIDE for best practices.
```

**Important**:
- ⚠️ This warning appears in **all environments** (development and production)
- 🔧 Must fix immediately, this is a correctness issue, not just a performance issue
- 📝 Use unique key prefixes to resolve

## Compile-time Checking

In addition to runtime warnings, WSXJS also provides ESLint rules to detect duplicate keys at compile time:

### Installation and Configuration

```bash
npm install --save-dev @wsxjs/eslint-plugin-wsx
```

```javascript
// .eslintrc.js
module.exports = {
    plugins: ['wsx'],
    rules: {
        'wsx/no-duplicate-keys': 'error',
    },
};
```

### ESLint Error Example

```tsx
// ❌ ESLint will report error
render() {
    return (
        <div>
            <nav>{items.map((item, i) => <a key={i}>{item}</a>)}</nav>
            <div>{otherItems.map((item, i) => <a key={i}>{item}</a>)}</div>
            {/* Error: Duplicate key "i" in different parent containers */}
        </div>
    );
}
```

## FAQ

### Q: Why can't the same key be used in different parent containers?

A: Because DOM elements in JavaScript can only have one parent node. When you call `appendChild`, if the element is already in another position in the DOM tree, it will be automatically **moved** instead of copied. WSXJS's caching mechanism relies on unique cache keys, and duplicate keys will cause elements to be incorrectly shared and moved.

### Q: All lists in my application use `key={index}`, will there be a problem?

A: If these lists are in different parent containers (e.g., different `<nav>`, `<div>`, `<section>`), then yes, there will be a problem! The solution is to add unique prefixes for each list, for example `key={`nav-${index}`}` and `key={`sidebar-${index}`}`.

### Q: Do I need to change the key in conditional rendering?

A: No. If the element's key remains unchanged, DOM elements will be correctly reused. Just ensure the same key doesn't appear in different parent containers.

### Q: What if my data items don't have unique IDs?

A: There are several options:
1. **Recommended**: Generate unique IDs for data items (e.g., using UUID)
2. Use index but add semantic prefix: `key={`${containerName}-${index}`}`
3. Use combination of data item properties to create unique key: `key={`${item.name}-${item.type}`}`

## Summary

| Rule | Description | Example |
|------|------|------|
| ❌ Prohibit duplicates | Don't use the same key in different parent containers | `key={0}` appears in both nav and div |
| ✅ Use prefixes | Add unique prefixes for elements in different locations | `key="nav-0"` vs `key="overflow-0"` |
| ✅ Keep consistent | Keep key unchanged in conditional rendering | `key={item.id}` remains consistent when showing/hiding |
| ⚠️ Monitor warnings | Pay attention to runtime warnings, fix immediately | Check browser console for DOMCacheManager warnings |

## Related Resources

- [Quick Start Guide](../essentials/getting-started.md)
- [Web Component Guide](../core-concepts/web-components.md)
- [Light Component Guide](../core-concepts/light-components.md)
- [TypeScript Configuration](../essentials/typescript-setup.md)

---

> 💡 **Tip**: Correctly using keys not only avoids bugs but also fully leverages the performance advantages of DOM caching!

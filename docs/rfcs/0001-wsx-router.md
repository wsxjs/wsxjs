# RFC 0001: WSX Router

- **Status**: Draft
- **Type**: Feature
- **Start Date**: 2025-01-25
- **Author**: WSX Team
- **状态**: Implemented
## Summary

This RFC proposes a native Web Components based routing solution for WSXJS that leverages browser History API and provides a declarative, zero-dependency router.

## Motivation

Current web applications need client-side routing, but existing solutions are:
- Framework-specific (React Router, Vue Router)
- Heavy with dependencies
- Overly complex for simple use cases
- Not Web Components friendly

WSX needs a routing solution that:
- Works with pure Web Components
- Uses native browser APIs
- Has zero dependencies
- Provides elegant declarative syntax

## Detailed Design

### Core Components

#### 1. `<wsx-router>` - Route Container
```html
<wsx-router>
  <wsx-view route="/" component="home-page"></wsx-view>
  <wsx-view route="/users/:id" component="user-detail"></wsx-view>
  <wsx-view route="*" component="not-found"></wsx-view>
</wsx-router>
```

**Responsibilities:**
- Collect child views
- Listen to `popstate` events
- Intercept link clicks
- Match routes and show/hide views

#### 2. `<wsx-view>` - Route View
```html
<wsx-view route="/users/:id" component="user-detail"></wsx-view>
```

**Attributes:**
- `route` - Path pattern (supports parameters)
- `component` - Component name to render
- `params` - Injected route parameters (readonly)

#### 3. `<wsx-link>` - Navigation Link
```html
<wsx-link to="/about">About</wsx-link>
```

**Features:**
- Auto-active state
- Triggers router navigation
- Supports CSS parts

### Route Matching Algorithm

```typescript
// Priority order:
// 1. Exact match: /about
// 2. Param match: /users/:id
// 3. Wildcard: *
```

### API Design

#### Declarative API
```html
<wsx-router>
  <wsx-view route="/" component="home-page"></wsx-view>
  <wsx-view route="/users/:id" component="user-detail"></wsx-view>
</wsx-router>
```

#### Programmatic API
```typescript
import { RouterUtils } from '@wsxjs/wsx-router';

// Navigate
RouterUtils.navigate('/users/123');

// Get params
const params = RouterUtils.getParams(); // { id: '123' }

// Browser navigation
RouterUtils.back();
RouterUtils.forward();
```

### Implementation Details

1. **History API Integration**
   - Use `pushState` for navigation
   - Listen to `popstate` for browser buttons
   - Preserve query parameters

2. **Link Interception**
   - Capture clicks on `<a>` elements
   - Ignore external and hash links
   - Prevent default and navigate

3. **View Management**
   - Hide all views initially
   - Show matching view on route change
   - Pass parameters as attributes

## Rationale and Alternatives

### Why `<wsx-view>` instead of `<wsx-route>`?

1. **Semantic accuracy** - It's a view container, not a route definition
2. **Clear responsibility** - Shows/hides content based on route
3. **Intuitive** - "Show this view on this route"
4. **Extensible** - Can add view-specific features later

### Alternatives Considered

1. **Using templates**
```html
<template route="/">content</template>
```
Rejected: Less flexible, harder to pass props

2. **Nested configuration**
```html
<wsx-routes>
  <route path="/" component="home"></route>
</wsx-routes>
```
Rejected: More verbose, less intuitive

3. **JavaScript configuration**
```javascript
router.addRoute('/', HomePage);
```
Rejected: Not declarative, requires imperative setup

## Prior Art

- **React Router** - Declarative routing for React
- **Vue Router** - Official router for Vue.js
- **Vaadin Router** - Web Components router
- **Page.js** - Micro client-side router

## Unresolved Questions

1. **Nested routes** - How to handle child routers?
2. **Route guards** - Authentication/authorization?
3. **Transitions** - View enter/leave animations?
4. **Scroll behavior** - Restore scroll position?

## Future Possibilities

1. **Route metadata**
```html
<wsx-view route="/" component="home" title="Home Page"></wsx-view>
```

2. **Lazy loading**
```html
<wsx-view route="/admin" component="admin-panel" lazy></wsx-view>
```

3. **Route guards**
```html
<wsx-view route="/admin" component="admin" guard="auth-guard"></wsx-view>
```

4. **Nested routing**
```html
<wsx-view route="/users/*" component="user-layout">
  <wsx-router>
    <wsx-view route="/profile" component="user-profile"></wsx-view>
  </wsx-router>
</wsx-view>
```

## Implementation Plan

### Phase 1: Core (Week 1)
- [ ] Basic router with exact matching
- [ ] View show/hide logic
- [ ] Link component

### Phase 2: Advanced (Week 2)
- [ ] Parameter matching
- [ ] Wildcard routes
- [ ] Programmatic navigation

### Phase 3: Polish (Week 3)
- [ ] TypeScript types
- [ ] Documentation
- [ ] Examples

## References

- [History API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
- [Web Components - MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API)

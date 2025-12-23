# @wsxjs/wsx-router

WSX Router - Native History API-based routing for WSXJS

## Features

- 🚀 **Zero dependencies** - Built on native History API
- 📦 **Lightweight** - Minimal bundle size
- 🎯 **TypeScript first** - Full type safety
- 🔄 **Declarative routing** - HTML-based route configuration
- 📱 **SPA-ready** - Single Page Application support
- 🎨 **Customizable** - CSS custom properties for styling

## Installation

```bash
pnpm add @wsxjs-router
```

## Quick Start

### 1. Basic Setup

```html
<wsx-router>
  <wsx-view route="/" component="home-page"></wsx-view>
  <wsx-view route="/about" component="about-page"></wsx-view>
  <wsx-view route="/users/:id" component="user-detail"></wsx-view>
  <wsx-view route="*" component="not-found"></wsx-view>
</wsx-router>
```

### 2. Navigation Links

```html
<wsx-link to="/">Home</wsx-link>
<wsx-link to="/about">About</wsx-link>
<wsx-link to="/users/123">User 123</wsx-link>
```

### 3. Programmatic Navigation

```typescript
import { RouterUtils } from '@wsxjs-router';

// Navigate to a route
RouterUtils.navigate('/users/456');

// Replace current route
RouterUtils.replace('/login');

// Go back
RouterUtils.goBack();
```

## Components

### WsxRouter

Main router container that manages route matching and rendering.

**Attributes:**
- None (router configuration is defined by child `wsx-view` elements)

**Events:**
- `route-changed`: Fired when route changes with `{ path, view }` detail

### WsxView

Route view container that conditionally renders components.

**Attributes:**
- `route`: Route pattern (supports parameters like `/users/:id`)
- `component`: Component name to render
- `params`: Route parameters (automatically set by router)

### WsxLink

Navigation link component with active state management.

**Attributes:**
- `to`: Target route path
- `replace`: Replace history instead of push (default: false)
- `active-class`: CSS class for active state (default: 'active')
- `exact`: Exact path matching (default: false)

**CSS Custom Properties:**
- `--link-color`: Link text color
- `--link-hover-color`: Link hover color
- `--link-active-color`: Active link color

## API Reference

### RouterUtils

Static utility class for programmatic navigation and route management.

#### Navigation Methods

```typescript
// Navigate to a route
RouterUtils.navigate(path: string, replace?: boolean): void

// Get current route information
RouterUtils.getCurrentRoute(): RouteInfo

// Check if route is active
RouterUtils.isRouteActive(route: string, exact?: boolean): boolean

// Build path with parameters
RouterUtils.buildPath(route: string, params?: Record<string, string>): string
```

#### Query Parameters

```typescript
// Get query parameter
RouterUtils.getQueryParam(key: string): string | null

// Set query parameter
RouterUtils.setQueryParam(key: string, value: string, replace?: boolean): void

// Remove query parameter
RouterUtils.removeQueryParam(key: string, replace?: boolean): void
```

#### History Management

```typescript
// Go back/forward
RouterUtils.goBack(): void
RouterUtils.goForward(): void

// Replace current route
RouterUtils.replace(path: string): void
```

### Types

```typescript
interface RouteInfo {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  hash: string;
  meta?: Record<string, string | number | boolean>;
}

interface RouteMatch {
  route: string;
  params: Record<string, string>;
  exact: boolean;
}
```

## Examples

### Parameter Routes

```html
<wsx-router>
  <wsx-view route="/users/:userId/posts/:postId" component="post-detail"></wsx-view>
</wsx-router>
```

The component will receive parameters as attributes:
```html
<!-- For route: /users/123/posts/456 -->
<post-detail userid="123" postid="456"></post-detail>
```

### Nested Routing

```html
<!-- Parent route with wildcard -->
<wsx-view route="/admin/*" component="admin-layout"></wsx-view>

<!-- Inside admin-layout component -->
<wsx-router base="/admin">
  <wsx-view route="/dashboard" component="admin-dashboard"></wsx-view>
  <wsx-view route="/users" component="admin-users"></wsx-view>
</wsx-router>
```

### Link Variations

```html
<!-- Basic link -->
<wsx-link to="/about">About</wsx-link>

<!-- Button style -->
<wsx-link to="/login" variant="button">Login</wsx-link>

<!-- Tab style -->
<wsx-link to="/dashboard" variant="tab">Dashboard</wsx-link>

<!-- External link -->
<wsx-link to="https://example.com" external>External Site</wsx-link>
```

## Styling

### CSS Custom Properties

```css
wsx-link {
  --link-color: #007bff;
  --link-hover-color: #0056b3;
  --link-active-color: #6c757d;
  --link-focus-color: #007bff;
}

wsx-view {
  --transition-duration: 300ms;
}
```

### CSS Parts

```css
/* Style the link element */
wsx-link::part(link) {
  font-weight: bold;
}

/* Style the view container */
wsx-view::part(view) {
  padding: 1rem;
}
```

## Browser Support

- Modern browsers with Web Components support
- Shadow DOM v1
- Custom Elements v1
- History API

## Contributing

See the main [WSXJS Contributing Guide](../../CONTRIBUTING.md).

## License

MIT License - see [LICENSE](../../LICENSE) for details.

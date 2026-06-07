# RFC 0005: WSX Router Enhancements

- **Status**: Completed
- **Type**: Enhancement
- **Start Date**: 2025-01-25
- **Author**: WSX Team
- **Depends On**: RFC 0001 (WSX Router)

## Summary

This RFC proposes enhancements to the WSX Router based on the "Future Possibilities" outlined in RFC 0001, including route metadata, lazy loading, route guards, and nested routing support.

## Motivation

After implementing the basic router (RFC 0001), we need to add enterprise-grade features:
- **Performance**: Lazy loading for code splitting
- **Security**: Route guards for authentication
- **UX**: Transitions and metadata
- **Scalability**: Nested routing for complex apps

## Detailed Design

### 1. Route Metadata

Allow routes to define metadata like page title, description, etc.

```html
<wsx-view 
  route="/" 
  component="home-page"
  title="Home - My App"
  meta-description="Welcome to our application"
></wsx-view>
```

**Implementation:**
```typescript
interface RouteMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  [key: string]: any;
}

// Auto-update document title
protected onActivated() {
  if (this.title) {
    document.title = this.title;
  }
}
```

### 2. Lazy Loading

Support dynamic imports for code splitting.

```html
<wsx-view 
  route="/admin" 
  component="admin-panel" 
  lazy
  loading-component="loading-spinner"
></wsx-view>
```

**Implementation:**
```typescript
private async loadComponent(componentName: string) {
  if (this.lazy && !customElements.get(componentName)) {
    // Show loading component
    this.showLoading();
    
    try {
      // Dynamic import based on naming convention
      await import(`./views/${componentName}.js`);
    } catch (error) {
      logger.error(`Failed to lazy load ${componentName}`, error);
      this.showError();
    }
  }
  
  // Continue with normal component creation
  this.createComponent(componentName);
}
```

### 3. Route Guards

Implement navigation guards for authentication and authorization.

```html
<wsx-view 
  route="/admin" 
  component="admin-panel"
  guard="auth-guard"
></wsx-view>
```

**Guard Interface:**
```typescript
interface RouteGuard {
  canActivate(
    to: RouteInfo,
    from: RouteInfo
  ): boolean | Promise<boolean>;
  
  canDeactivate?(
    from: RouteInfo,
    to: RouteInfo
  ): boolean | Promise<boolean>;
}

// Example guard
@autoRegister()
export class AuthGuard extends WebComponent implements RouteGuard {
  async canActivate(to: RouteInfo): Promise<boolean> {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      RouterUtils.navigate('/login');
      return false;
    }
    return true;
  }
}
```

### 4. View Transitions

Support smooth transitions between routes.

```html
<wsx-view 
  route="/gallery" 
  component="photo-gallery"
  transition="slide-left"
  transition-duration="300"
></wsx-view>
```

**CSS Transitions:**
```css
.route-view[transition="slide-left"] {
  animation: slideInLeft var(--transition-duration, 300ms) ease-out;
}

.route-view[transition="slide-left"].leaving {
  animation: slideOutLeft var(--transition-duration, 300ms) ease-in;
}

@keyframes slideInLeft {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

### 5. Nested Routing

Support child routers for complex layouts.

```html
<wsx-view route="/users/*" component="user-layout">
  <!-- Child router will be inside user-layout component -->
</wsx-view>

<!-- Inside user-layout component: -->
<wsx-router base="/users">
  <wsx-view route="/profile" component="user-profile"></wsx-view>
  <wsx-view route="/settings" component="user-settings"></wsx-view>
</wsx-router>
```

**Implementation:**
```typescript
// Router supports base path
@autoRegister()
export class WsxRouter extends WebComponent {
  static observedAttributes = ['base'];
  private basePath: string = '';
  
  private getFullPath(route: string): string {
    return this.basePath + route;
  }
}
```

### 6. Route Lifecycle Events

Emit events for route transitions.

```typescript
// Events emitted by router
interface RouteEvents {
  'route-before-leave': CustomEvent<{ from: string; to: string }>;
  'route-leave': CustomEvent<{ from: string }>;
  'route-before-enter': CustomEvent<{ to: string }>;  
  'route-enter': CustomEvent<{ to: string; params: any }>;
  'route-error': CustomEvent<{ error: Error }>;
}
```

## File Organization

```
packages/base-components/src/
├── router/
│   ├── index.ts              # Main exports
│   ├── WsxRouter.wsx         # Router container
│   ├── WsxRouter.css         # Router styles
│   ├── WsxView.wsx          # Route view component
│   ├── WsxView.css          # View styles
│   ├── WsxLink.wsx          # Navigation link
│   ├── WsxLink.css          # Link styles
│   ├── RouterUtils.ts       # Utility functions
│   ├── guards/
│   │   ├── RouteGuard.ts    # Guard interface
│   │   └── AuthGuard.wsx    # Example guard
│   └── transitions/
│       └── transitions.css   # Transition styles
```

## Implementation Phases

### Phase 1: Metadata & Events (Week 1)
- [ ] Route metadata support
- [ ] Lifecycle events
- [ ] Document title updates

### Phase 2: Lazy Loading (Week 2)
- [ ] Dynamic imports
- [ ] Loading states
- [ ] Error handling

### Phase 3: Guards (Week 3)
- [ ] Guard interface
- [ ] Guard execution
- [ ] Redirect handling

### Phase 4: Transitions (Week 4)
- [ ] CSS transitions
- [ ] JavaScript animations
- [ ] Transition coordination

### Phase 5: Nested Routing (Week 5-6)
- [ ] Base path support
- [ ] Child router discovery
- [ ] Path resolution

## Migration Guide

Existing router usage remains unchanged. New features are opt-in:

```html
<!-- Basic (still works) -->
<wsx-view route="/" component="home"></wsx-view>

<!-- Enhanced (new features) -->
<wsx-view 
  route="/" 
  component="home"
  title="Home"
  lazy
  guard="public-guard"
  transition="fade"
></wsx-view>
```

## Testing Strategy

1. **Unit Tests**
   - Metadata application
   - Guard execution
   - Lazy loading

2. **Integration Tests**
   - Nested routing
   - Transition timing
   - Event sequences

3. **E2E Tests**
   - Full navigation flows
   - Guard redirects
   - Loading states

## Performance Considerations

1. **Lazy Loading**
   - Reduces initial bundle size
   - Requires good loading UX

2. **Transitions**
   - Use CSS over JavaScript when possible
   - Avoid layout thrashing

3. **Guards**
   - Cache guard results
   - Async guards should be fast

## Security Considerations

1. **Guards**
   - Never trust client-side only
   - Always validate on server

2. **Dynamic Imports**
   - Validate import paths
   - Handle import failures

## Unresolved Questions

1. **Preloading** - Should we support route preloading?
2. **Scroll Position** - How to handle scroll restoration?
3. **Animation API** - Use Web Animations API?
4. **Error Boundaries** - How to handle component errors?

## References

- [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [Dynamic Imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API)

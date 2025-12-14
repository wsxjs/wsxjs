# WSX Framework Component Architecture

> **注意**: 本文档已合并到 RFC 格式。请查看 [RFC-0006: Light DOM Components](../rfcs/0006-light-dom-components.md) 获取最新和完整的信息，包括 Container vs Leaf 组件策略。

## Container vs Leaf Component Strategy

WSX Framework follows a **Container-Light, Leaf-Shadow** architecture pattern for optimal third-party library compatibility and style isolation.

## Component Categories

### Container Components (Light DOM by Default)
**Purpose**: Layout, routing, and third-party library integration

- `wsx-route` - Routing containers
- `wsx-view` - View containers  
- `wsx-layout` - Layout containers
- `wsx-section` - Section containers
- Third-party wrappers (EditorJS, Charts, etc.)

**Characteristics**:
- ✅ Light DOM for library compatibility
- ✅ Global DOM access
- ✅ Third-party integration friendly
- ⚠️ Manual style scoping required

### Leaf Components (Shadow DOM by Default)
**Purpose**: Reusable UI components with style isolation

- `wsx-button` - Interactive buttons
- `wsx-modal` - Overlay components
- `wsx-input` - Form controls
- `wsx-card` - Content containers
- `wsx-dropdown` - Menu components

**Characteristics**:
- ✅ Automatic style isolation
- ✅ Encapsulated behavior
- ✅ Reusable across projects
- ⚠️ Limited third-party integration

## Implementation Pattern

### Container Component Base
```typescript
import { LightComponent } from '@wsxjs/wsx-core';

@autoRegister({tagName: "wsx-route"})
export class WsxRoute extends LightComponent {
  constructor() {
    super({
      lightDOM: true,  // Explicit Light DOM
      styleName: "wsx-route",
      styles: containerStyles
    });
  }
}
```

### Leaf Component Base
```typescript
import { WebComponent } from '@wsxjs/wsx-core';

@autoRegister({tagName: "wsx-button"})
export class WsxButton extends WebComponent {
  constructor() {
    super({
      // Shadow DOM by default
      styles: buttonStyles
    });
  }
}
```

## Usage Examples

### ✅ Correct: Container → Leaf Structure
```tsx
<wsx-route path="/dashboard">          {/* Container: Light DOM */}
  <wsx-layout>                         {/* Container: Light DOM */}
    <wsx-section class="header">       {/* Container: Light DOM */}
      <wsx-button>Save</wsx-button>    {/* Leaf: Shadow DOM */}
      <wsx-dropdown>                   {/* Leaf: Shadow DOM */}
        <wsx-button>Edit</wsx-button>  {/* Leaf: Shadow DOM */}
      </wsx-dropdown>
    </wsx-section>
    
    <wsx-section class="content">      {/* Container: Light DOM */}
      <editor-wrapper>                 {/* Container: Light DOM */}
        <editorjs-demo />              {/* Third-party friendly */}
      </editor-wrapper>
    </wsx-section>
  </wsx-layout>
</wsx-route>
```

### ❌ Incorrect: Leaf → Container Structure
```tsx
<wsx-button>                    {/* Leaf: Shadow DOM */}
  <wsx-route>                   {/* Container would be trapped in Shadow DOM */}
    <third-party-component />   {/* Cannot access document */}
  </wsx-route>
</wsx-button>
```

## Decision Matrix

| Component Type | DOM Type | Use Case | Example |
|---|---|---|---|
| **Router** | Light DOM | Navigation, URL handling | `wsx-route`, `wsx-link` |
| **Layout** | Light DOM | Page structure | `wsx-layout`, `wsx-section` |
| **Wrapper** | Light DOM | Third-party integration | `editor-wrapper`, `chart-wrapper` |
| **UI Control** | Shadow DOM | Interactive elements | `wsx-button`, `wsx-input` |
| **Widget** | Shadow DOM | Self-contained components | `wsx-modal`, `wsx-tooltip` |
| **Display** | Shadow DOM | Content presentation | `wsx-card`, `wsx-badge` |

## Naming Conventions

### Container Components
- Prefix: `wsx-` + semantic name
- Examples: `wsx-route`, `wsx-view`, `wsx-layout`, `wsx-section`
- Purpose: Structure and organization

### Leaf Components  
- Prefix: `wsx-` + UI element name
- Examples: `wsx-button`, `wsx-input`, `wsx-modal`, `wsx-card`
- Purpose: User interaction and display

### Third-Party Wrappers
- Suffix: `-wrapper` or `-container`
- Examples: `editor-container`, `chart-wrapper`, `map-container`
- Purpose: Library integration

## Style Management

### Container Components (Light DOM)
```typescript
// Use scoped CSS with naming conventions
const containerStyles = `
.wsx-route {
  /* Container-specific styles */
  display: block;
  width: 100%;
}

.wsx-route__header {
  /* BEM methodology for scoping */
}
`;
```

### Leaf Components (Shadow DOM)
```typescript
// Use regular CSS - automatically scoped
const leafStyles = `
:host {
  /* Component host styles */
  display: inline-block;
}

button {
  /* No scoping needed - Shadow DOM isolated */
  background: var(--primary-color);
}
`;
```

## Best Practices

### 1. Component Composition
- Start with containers (Light DOM)
- Add leaf components (Shadow DOM) for UI elements
- Wrap third-party libraries in Light DOM containers

### 2. Style Strategy
- Containers: Use BEM or CSS Modules for scoping
- Leaves: Use Shadow DOM's natural isolation
- Theme: Use CSS custom properties that pierce Shadow DOM

### 3. Event Handling
- Container events bubble naturally through Light DOM
- Leaf events need explicit event forwarding from Shadow DOM
- Use CustomEvent for component communication

### 4. Third-Party Integration
- Always wrap in Light DOM container
- Document specific integration requirements
- Test with multiple library versions

## Migration Guide

### From All Shadow DOM
1. Identify container components (layout, routing)
2. Convert to `LightComponent` base class
3. Update styles to use scoped naming
4. Test third-party library integration

### From All Light DOM
1. Identify leaf components (buttons, inputs, widgets)
2. Convert to `WebComponent` base class  
3. Remove manual style scoping
4. Test style isolation

## Framework Guidelines (Not Enforced)

WSX Framework **recommends** this pattern but gives developers full choice:

```typescript
// Recommended: Container components use Light DOM
@autoRegister()
export class WsxRoute extends LightComponent {
  constructor() {
    super({ lightDOM: true }); // Developer's choice
  }
}

// Recommended: UI components use Shadow DOM  
@autoRegister()
export class WsxButton extends WebComponent {
  constructor() {
    super({ /* Shadow DOM by default */ }); // Developer's choice
  }
}
```

**The framework provides the tools, developers make the decisions.**

This architecture ensures WSX Framework components work seamlessly with the entire web ecosystem while maintaining the benefits of Web Components encapsulation where appropriate.

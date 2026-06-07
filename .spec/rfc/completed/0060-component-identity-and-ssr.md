# RFC 0060: Component Identity & SSR Hydration Strategy

## Status

- **Status**: Proposed
- **Author**: WSXJS Team
- **Created**: 2026-01-24

## Problem Description

The `_wsxInstanceId` property was introduced to support stable component identity, primarily for future Server-Side Rendering (SSR) hydration. However, its purpose and lifecycle were under-documented, leading to misuse where components fell back to a shared "default" ID in Client-Side Rendering (CSR) contexts.

This caused:
1.  **Key Collisions**: Multiple instances sharing `default` ID generated identical cache keys (e.g., `Component:default:div:1`).
2.  **Reconciliation Errors**: The framework could not distinguish between DOM nodes of sibling components.
3.  **Confusion**: The purpose of `_wsxInstanceId` vs. runtime generated IDs was unclear.

## Proposed Architecture

We formally define the **Component Identity Strategy** with two modes of operation:

### 1. Client-Side Rendering (CSR) - "Auto Mode"
In standard CSR (the current default), components do not persist identity across page loads.
- **Behavior**: `_wsxInstanceId` is `undefined`.
- **Fallback**: The `getComponentId` utility generates a session-unique, auto-incrementing ID (e.g., `inst-1`, `inst-2`) backed by a `WeakMap`.
- **Scope**: Unique per browser session/refresh.
- **Use Case**: Single Page Applications (SPA), dynamic widgets.

### 2. Server-Side Rendering (SSR) & Hydration - "Stable Mode"
In SSR scenarios, the server generates the markup. The client must "attach" to the existing DOM without destroying it.
- **Requirement**: The server and client MUST agree on the Component ID to generate matching cache key hashes.
- **Mechanism**:
    1.  **Server**: Generates ID (e.g., `comp-a1b2`) and renders `<my-comp data-wsx-id="comp-a1b2">`.
    2.  **Client (Hydration)**: `BaseComponent` constructor or `connectedCallback` reads `this.getAttribute('data-wsx-id')`.
    3.  **Assignment**: Sets `this._wsxInstanceId = "comp-a1b2"`.
    4.  **Key Generation**: `getComponentId` sees the value and uses it instead of the auto-increment counter.
- **Result**: `Component:comp-a1b2:div:1` on the client matches the server's serialized state.

## Implementation Plan

### Phase 1: Cleanup & Formalization (Completed in RFC 0059)
- [x] Rename `_instanceId` to `_wsxInstanceId` to avoid collisions with user code.
- [x] Add `_wsxInstanceId` to `BaseComponent` type definition.
- [x] Implement robust CSR fallback (auto-increment) when `_wsxInstanceId` is missing.

### Phase 2: Hydration Hook (Future)
- [ ] Update `BaseComponent.connectedCallback` to check for `data-wsx-id` attribute.
- [ ] If present, assign to `_wsxInstanceId`.
- [ ] Ensure this assignment happens *before* the first `render()` to guarantee key stability.

### Phase 3: SSR Generator (Future)
- [ ] Create `renderToString` utility that accepts a registry of component IDs.
- [ ] Ensure it injects `data-wsx-id` into the root element of components.

## Impact

This RFC clarifies that `_wsxInstanceId` is a **reserved interface** for hydration and advanced identity control. Standard development should rely on the automatic fallback mechanism, which has now been fixed to be collision-free (RFC 0059).

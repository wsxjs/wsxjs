# RFC 0059: Calendar Ghost Node & Grid Misalignment Fix

## Status

- **Status**: Completed
- **Author**: WSXJS Team
- **Created**: 2026-01-24

## Problem Description

The `wsx-calendar` component (and potentially other list-based components) exhibited severe rendering artifacts when navigating between months:
1.  **Ghost Nodes**: Text nodes from the previous month (e.g., "28", "29", "30") were piling up at the end of the grid container instead of being removed.
2.  **Grid Misalignment**: New dates (e.g., "1") were being shifted into incorrect columns because the ghost nodes occupied the earlier DOM slots.
3.  **State Leakage**: The reconciliation engine was failing to distinguish between "old" text nodes that should be deleted and "new" text nodes that should be created or updated.

### Root Cause Analysis

1.  **Weak Node Removal Logic**: The `shouldRemoveNode` function was too conservative. It allowed "unclaimed" text nodes to persist because they weren't explicitly marked for removal, especially when they weren't part of the new virtual DOM structure.
2.  **Incorrect Matching Map**: The `updateChildren` loop was building a map from the *new* children (`buildNewChildrenMaps`) but using it to try and find *old* nodes. This fundamental logic error meant the reconciler often couldn't find the existing DOM node to reuse, leading to the creation of duplicate nodes while leaving the old ones behind.
3.  **Key Collision**: Without a globally unique instance ID, components often generated colliding cache keys (e.g., `wsx-calendar:div:auto-1`). If multiple components or render cycles shared these weak keys, the reconciler could mistakenly reclaim a node from a different context or fail to differentiate between "Jan 30" and "Feb 1".

## Solution Architecture

The solution involves three targeted fixes to the core reconciliation engine:

### 1. Strict Node Removal (`shouldRemoveNode`)

We redefined the removal policy to be "strict by default". Any node that is not:
- Explicitly claimed by the new render state (tracked via `processedNodes`), OR
- Explicitly preserved (e.g., 3rd-party widgets with `data-wsx-preserve`),

...is now summarily purged. This is especially strict for text nodes, which caused the calendar artifacts.

```typescript
// Old Logic: Ambiguous, defaulted to keeping nodes if unsure
// New Logic:
if (processedNodes.has(node)) return false; // Keep if reused/created
if (shouldPreserveElement(node)) return false; // Keep if 3rd party
return true; // DELETE EVERYTHING ELSE
```

### 2. Correct Reconciliation Mapping (`element-update.ts`)

We separated the mapping logic to respect time travel:
- **Old Map (`oldKeyMap`)**: Built from `flatOld` (the current DOM state). Used *only* for finding nodes to reuse.
- **New Map (`newMaps`)**: Built from `flatNew` (the future state). Used *only* for determining what to keep and what to delete.

This ensures that when we process "Item 1" in the new list, we look up "Item 1" in the *old* map to find its existing DOM node.

### 3. Unique Instance Identity (`_wsxInstanceId`)

We replaced the unreliable `_instanceId` with a robust `_wsxInstanceId` system in `cache-key.ts`.
- **Mechanism**: A `WeakMap` tracks every `BaseComponent` instance.
- **Behavior**: If a component doesn't have an ID, it is assigned a globally unique, auto-incrementing integer (e.g., `inst-1`, `inst-2`).
- **Impact**: Cache keys like `MyComponent:inst-5:div:auto-1` are now guaranteed to be unique to that specific component instance, preventing cross-component pollution.

## Implementation Details

### `packages/core/src/utils/update-children-helpers.ts`
- Updated `shouldRemoveNode` to use the strict logic described above.
- Updated `buildNodeMaps` to be generic (handling both old and new lists).

### `packages/core/src/utils/element-update.ts`
- Refactored `updateChildren` to generate `oldKeyMap` from `oldChildren` and use it for the primary reconciliation loop.

### `packages/core/src/utils/cache-key.ts`
- Renamed `_instanceId` to `_wsxInstanceId`.
- Added `instanceAutoIds` (WeakMap) and `globalAutoId` Counter to generate unique IDs on demand.

## Verification

A regression test (`packages/core/src/__tests__/calendar-repro.test.ts`) was created to simulate the ghost node scenario. It confirms that transitioning from a 7-item list to another 7-item list results in exactly 7 DOM nodes, with no residuals.

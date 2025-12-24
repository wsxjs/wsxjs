/**
 * @wsxjs/wsx-press/client
 * Client-side components entry point
 *
 * IMPORTANT: Import components directly (not just export) to ensure
 * @autoRegister decorators are executed and components are registered.
 */

// Import DocPage component (triggers @autoRegister decorator)
import "./components/DocPage.wsx";

// Import DocSearch component (triggers @autoRegister decorator)
import "./components/DocSearch.wsx";

// Import DocLayout component (triggers @autoRegister decorator)
import "./components/DocLayout.wsx";

// Import DocSidebar component (triggers @autoRegister decorator)
import "./components/DocSidebar.wsx";

// Import DocTOC component (triggers @autoRegister decorator)
import "./components/DocTOC.wsx";

// Export components for type checking and explicit usage
export { default as DocPage } from "./components/DocPage.wsx";
export { default as DocSearch } from "./components/DocSearch.wsx";
export { default as DocLayout } from "./components/DocLayout.wsx";
export { default as DocSidebar } from "./components/DocSidebar.wsx";
export { default as DocTOC } from "./components/DocTOC.wsx";

// Components will be exported here as they are implemented
// export { DocBreadcrumb } from "./components/DocBreadcrumb.wsx";

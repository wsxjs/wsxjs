/**
 * DOM utilities for WSX
 *
 * Provides helper functions for DOM manipulation and HTML parsing
 */

/**
 * Convert HTML string to DOM nodes (elements and text)
 *
 * This function parses an HTML string and returns an array of DOM nodes
 * that can be used directly in WSX JSX. Text nodes are converted to strings,
 * while HTML/SVG elements are kept as DOM elements.
 *
 * @param html - HTML string to parse
 * @returns Array of HTMLElement, SVGElement, or string (for text nodes)
 *
 * @example
 * ```tsx
 * const nodes = parseHTMLToNodes('<p>Hello <strong>World</strong></p>');
 * // Returns: [HTMLElement (<p>), ...]
 *
 * return (
 *   <div>
 *     {nodes}
 *   </div>
 * );
 * ```
 */
export function parseHTMLToNodes(html: string): (HTMLElement | SVGElement | string)[] {
    if (!html) return [];

    // Create a temporary container to parse HTML
    // Note: innerHTML is used here for framework-level HTML parsing utility
    // This is an exception to the no-inner-html rule for framework code
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Convert all child nodes to array
    // Text nodes are converted to strings, elements are kept as-is
    return Array.from(temp.childNodes).map((node) => {
        if (node instanceof HTMLElement || node instanceof SVGElement) {
            return node;
        } else {
            // Convert text nodes and other node types to strings
            return node.textContent || "";
        }
    });
}

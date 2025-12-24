/**
 * Type definitions for @wsxjs/wsx-marked-components
 */

import type { Tokens } from "marked";

/**
 * Custom token renderer function type
 * 
 * @param token - The token to render
 * @param defaultRender - Function to call default rendering logic
 * @returns HTMLElement or null (null means use default rendering)
 * 
 * @example
 * ```typescript
 * const customHeadingRenderer: TokenRenderer = (token, defaultRender) => {
 *   if (token.type === 'heading') {
 *     const headingToken = token as Tokens.Heading;
 *     // Custom logic here
 *     return defaultRender(); // Or return custom element
 *   }
 *   return null; // Use default for other types
 * };
 * ```
 */
export type TokenRenderer = (
    token: Tokens.Generic,
    defaultRender: () => HTMLElement | null
) => HTMLElement | null;

/**
 * Custom renderers configuration
 * Maps token types to custom renderer functions
 */
export interface CustomRenderers {
    [tokenType: string]: TokenRenderer;
}

/**
 * Markdown component options
 */
export interface MarkdownOptions {
    /**
     * Custom renderers for specific token types
     */
    customRenderers?: CustomRenderers;
    
    /**
     * Custom CSS class name for the content container
     */
    contentClass?: string;
    
    /**
     * Whether to enable debug logging
     */
    debug?: boolean;
}


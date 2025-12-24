/**
 * Marked utilities for Pattern 1 and Pattern 2
 * Shared utilities for extracting and rendering inline tokens
 */

import type { Tokens } from "marked";

/**
 * Helper to escape HTML for attributes
 */
export function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    // Framework utility function for HTML escaping - innerHTML is necessary here
    return div.innerHTML;
}

/**
 * Extract inline tokens from a list of tokens
 * Handles paragraph tokens by extracting their inline tokens
 */
export function extractInlineTokens(tokens: Tokens.Generic[] | undefined): Tokens.Generic[] {
    // 防御性检查：确保 tokens 存在且是数组
    if (!tokens || !Array.isArray(tokens)) {
        return [];
    }

    const inlineTokens: Tokens.Generic[] = [];

    tokens.forEach((token) => {
        if (token.type === "paragraph") {
            // If it's a paragraph, extract its inline tokens
            const paraToken = token as Tokens.Paragraph;
            // 防御性检查：确保 paraToken.tokens 存在
            if (paraToken.tokens && Array.isArray(paraToken.tokens)) {
                inlineTokens.push(...paraToken.tokens);
            }
        } else if (
            token.type === "text" ||
            token.type === "strong" ||
            token.type === "em" ||
            token.type === "link" ||
            token.type === "code" ||
            token.type === "br"
        ) {
            // If it's already an inline token, add it directly
            inlineTokens.push(token);
        }
        // For other block-level tokens, we skip them
        // If needed, they can be handled separately
    });

    return inlineTokens;
}

/**
 * Render inline tokens to HTML string
 * Used by both Pattern 1 and Pattern 2
 */
export function renderInlineTokens(tokens: Tokens.Generic[] | undefined): string {
    // 防御性检查：确保 tokens 存在且是数组
    if (!tokens || !Array.isArray(tokens)) {
        return "";
    }

    return tokens
        .map((token) => {
            switch (token.type) {
                case "text": {
                    const textToken = token as Tokens.Text;
                    return textToken.text || "";
                }
                case "strong": {
                    const strongToken = token as Tokens.Strong;
                    // 防御性检查：确保 strongToken.tokens 存在
                    const nestedTokens = strongToken.tokens && Array.isArray(strongToken.tokens) 
                        ? strongToken.tokens 
                        : [];
                    return `<strong>${renderInlineTokens(nestedTokens)}</strong>`;
                }
                case "em": {
                    const emToken = token as Tokens.Em;
                    // 防御性检查：确保 emToken.tokens 存在
                    const nestedTokens = emToken.tokens && Array.isArray(emToken.tokens) 
                        ? emToken.tokens 
                        : [];
                    return `<em>${renderInlineTokens(nestedTokens)}</em>`;
                }
                case "link": {
                    const linkToken = token as Tokens.Link;
                    const title = linkToken.title ? ` title="${escapeHtml(linkToken.title)}"` : "";
                    // 防御性检查：确保 linkToken.tokens 存在
                    const nestedTokens = linkToken.tokens && Array.isArray(linkToken.tokens) 
                        ? linkToken.tokens 
                        : [];
                    return `<a href="${linkToken.href || "#"}"${title}>${renderInlineTokens(nestedTokens)}</a>`;
                }
                case "code": {
                    const codeToken = token as Tokens.Code;
                    return `<code>${escapeHtml(codeToken.text || "")}</code>`;
                }
                case "br": {
                    return "<br>";
                }
                default: {
                    // For unknown token types, return empty string
                    return "";
                }
            }
        })
        .join("");
}

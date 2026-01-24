/**
 * DOM utilities for WSX
 *
 * Provides helper functions for DOM manipulation and HTML parsing
 */

// JSX子元素类型
export type JSXChildren =
    | string
    | number
    | HTMLElement
    | SVGElement
    | DocumentFragment
    | Node
    | JSXChildren[]
    | null
    | undefined
    | boolean;

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
            // 关键修复：标记解析出的元素为框架管理
            // 这确保了 shouldPreserveElement 不会错误地保留这些元素
            // 从而防止了在频繁重渲染（如 Markdown 输入）时的元素堆积
            (node as HTMLElement & { __wsxManaged?: boolean }).__wsxManaged = true;
            return node;
        } else {
            // Convert text nodes and other node types to strings
            // Note: When these strings are processed by appendChildrenToElement,
            // they will be wraped in managed text nodes.
            return node.textContent || "";
        }
    });
}

/**
 * 检测字符串是否包含HTML标签
 * 使用更严格的检测：必须包含完整的 HTML 标签（开始和结束标签，或自闭合标签）
 */
export function isHTMLString(str: string): boolean {
    const trimmed = str.trim();
    if (!trimmed) return false;

    // 更严格的检测：必须包含完整的 HTML 标签
    // 1. 必须以 < 开头
    // 2. 后面跟着字母（标签名）
    // 3. 必须包含 > 来闭合标签
    // 4. 排除单独的 < 或 > 符号（如数学表达式 "a < b"）
    const htmlTagPattern = /<[a-z][a-z0-9]*(\s[^>]*)?(\/>|>)/i;

    // 额外检查：确保不是纯文本中的 < 和 >（如 "a < b" 或 "x > y"）
    // 如果字符串看起来像数学表达式或纯文本，不应该被检测为 HTML
    const looksLikeMath = /^[^<]*<[^>]*>[^>]*$/.test(trimmed) && !htmlTagPattern.test(trimmed);
    if (looksLikeMath) return false;

    const result = htmlTagPattern.test(trimmed);
    return result;
}

/**
 * 扁平化子元素数组
 * 自动检测HTML字符串并转换为DOM节点
 *
 * @param children - 子元素数组
 * @param skipHTMLDetection - 是否跳过HTML检测（用于已解析的节点，避免无限递归）
 * @param depth - 当前递归深度（防止无限递归，最大深度为 10）
 */
export function flattenChildren(
    children: JSXChildren[],
    skipHTMLDetection: boolean = false,
    depth: number = 0
): JSXChildren[] {
    // 防止无限递归：如果深度超过 10，停止处理
    if (depth > 10) {
        console.warn(
            "[WSX] flattenChildren: Maximum depth exceeded, treating remaining children as text"
        );
        return children.filter(
            (child): child is string | number =>
                typeof child === "string" || typeof child === "number"
        );
    }
    const result: JSXChildren[] = [];

    for (const child of children) {
        if (child === null || child === undefined || child === false) {
            continue;
        } else if (Array.isArray(child)) {
            // 递归处理数组，保持 skipHTMLDetection 状态，增加深度
            result.push(...flattenChildren(child, skipHTMLDetection, depth + 1));
        } else if (typeof child === "string") {
            // 如果跳过HTML检测，直接添加字符串（避免无限递归）
            if (skipHTMLDetection) {
                result.push(child);
            } else if (isHTMLString(child)) {
                // 自动检测HTML字符串并转换为DOM节点
                try {
                    const nodes = parseHTMLToNodes(child);
                    if (nodes.length > 0) {
                        // 直接添加解析后的节点，不再递归处理（避免无限递归）
                        for (const node of nodes) {
                            result.push(node);
                        }
                    } else {
                        result.push(child);
                    }
                } catch (error) {
                    console.warn("[WSX] Failed to parse HTML string, treating as text:", error);
                    result.push(child);
                }
            } else {
                result.push(child);
            }
        } else if (child instanceof DocumentFragment) {
            // 递归处理 DocumentFragment 中的子节点
            const fragmentChildren = Array.from(child.childNodes);
            result.push(...flattenChildren(fragmentChildren, skipHTMLDetection, depth + 1));
        } else {
            // 保持 Node 引用
            result.push(child);
        }
    }

    return result;
}

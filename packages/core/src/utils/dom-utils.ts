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
            return node;
        } else {
            // Convert text nodes and other node types to strings
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

    return htmlTagPattern.test(trimmed);
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
): (string | number | HTMLElement | SVGElement | DocumentFragment | boolean | null | undefined)[] {
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
    const result: (
        | string
        | number
        | HTMLElement
        | SVGElement
        | DocumentFragment
        | boolean
        | null
        | undefined
    )[] = [];

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
                // 使用 try-catch 防止解析失败导致崩溃
                try {
                    const nodes = parseHTMLToNodes(child);
                    // 递归处理转换后的节点数组，标记为已解析，避免再次检测HTML
                    // parseHTMLToNodes 返回的字符串是纯文本节点，不应该再次被检测为HTML
                    // 但是为了安全，我们仍然设置 skipHTMLDetection = true
                    if (nodes.length > 0) {
                        // 直接添加解析后的节点，不再递归处理（避免无限递归）
                        // parseHTMLToNodes 已经完成了所有解析工作
                        for (const node of nodes) {
                            if (typeof node === "string") {
                                // 文本节点直接添加，不再检测 HTML（已解析）
                                result.push(node);
                            } else {
                                // DOM 元素直接添加
                                result.push(node);
                            }
                        }
                    } else {
                        // 如果解析失败，回退到纯文本
                        result.push(child);
                    }
                } catch (error) {
                    // 如果解析失败，回退到纯文本，避免崩溃
                    console.warn("[WSX] Failed to parse HTML string, treating as text:", error);
                    result.push(child);
                }
            } else {
                result.push(child);
            }
        } else if (child instanceof DocumentFragment) {
            // 递归处理 DocumentFragment 中的子节点
            // 注意：Array.from 会创建子节点的引用副本，
            // 这样即使 Fragment 在后续过程中被 appendChild 清空，
            // 我们的 flat children 列表仍然持有正确的节点引用。
            // 关键：不能递归调用 flattenChildren(Array.from(child.childNodes))，
            // 因为 DocumentFragment 本身不支持 skipHTMLDetection。
            // 我们直接将其子节点展平到当前结果中。
            const fragmentChildren = Array.from(child.childNodes);
            for (const fragChild of fragmentChildren) {
                if (fragChild instanceof HTMLElement || fragChild instanceof SVGElement) {
                    result.push(fragChild);
                } else if (fragChild.nodeType === Node.TEXT_NODE) {
                    result.push(fragChild.textContent || "");
                } else if (fragChild instanceof DocumentFragment) {
                    // 处理嵌套 Fragment（防御性编程）
                    result.push(...flattenChildren([fragChild], skipHTMLDetection, depth + 1));
                }
            }
        } else {
            result.push(child);
        }
    }

    return result;
}

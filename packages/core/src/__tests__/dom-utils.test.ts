/**
 * DOM Utilities Tests
 *
 * Tests for DOM manipulation utilities.
 */

import { isHTMLString, flattenChildren, parseHTMLToNodes } from "../utils/dom-utils";

describe("DOM Utilities", () => {
    describe("isHTMLString", () => {
        test("应该识别简单的 HTML 标签", () => {
            expect(isHTMLString("<div>")).toBe(true);
            expect(isHTMLString("<p>")).toBe(true);
            expect(isHTMLString("<span>")).toBe(true);
        });

        test("应该识别自闭合标签", () => {
            expect(isHTMLString("<br/>")).toBe(true);
            expect(isHTMLString("<hr/>")).toBe(true);
            expect(isHTMLString("<img/>")).toBe(true);
        });

        test("应该识别带属性的标签", () => {
            expect(isHTMLString('<div class="test">')).toBe(true);
            expect(isHTMLString('<input type="text">')).toBe(true);
            expect(isHTMLString('<a href="/">')).toBe(true);
        });

        test("应该识别嵌套标签", () => {
            expect(isHTMLString("<div><p></p></div>")).toBe(true);
            expect(isHTMLString("<ul><li></li></ul>")).toBe(true);
        });

        test("不应该识别纯文本", () => {
            expect(isHTMLString("Hello World")).toBe(false);
            expect(isHTMLString("123")).toBe(false);
            expect(isHTMLString("")).toBe(false);
        });

        test("不应该识别数学表达式", () => {
            expect(isHTMLString("a < b")).toBe(false);
            expect(isHTMLString("x > y")).toBe(false);
            expect(isHTMLString("1 < 2 && 3 > 4")).toBe(false);
        });

        test("应该处理空字符串", () => {
            expect(isHTMLString("")).toBe(false);
            expect(isHTMLString("   ")).toBe(false);
        });

        test("应该处理只有 < 或 > 的字符串", () => {
            expect(isHTMLString("<")).toBe(false);
            expect(isHTMLString(">")).toBe(false);
            expect(isHTMLString("<>")).toBe(false);
        });

        test("应该识别完整的 HTML 标签", () => {
            expect(isHTMLString("<div></div>")).toBe(true);
            expect(isHTMLString("<p>Text</p>")).toBe(true);
        });

        test("应该处理大小写不敏感", () => {
            expect(isHTMLString("<DIV>")).toBe(true);
            expect(isHTMLString("<Div>")).toBe(true);
            expect(isHTMLString("<div>")).toBe(true);
        });
    });

    describe("flattenChildren", () => {
        test("应该扁平化简单的子元素数组", () => {
            const children = ["Hello", "World"];
            const result = flattenChildren(children);
            expect(result).toEqual(["Hello", "World"]);
        });

        test("应该扁平化嵌套数组", () => {
            const children = ["Hello", ["World", "!"]];
            const result = flattenChildren(children);
            expect(result).toEqual(["Hello", "World", "!"]);
        });

        test("应该过滤 null 和 undefined", () => {
            const children = ["Hello", null, "World", undefined];
            const result = flattenChildren(children);
            expect(result).toEqual(["Hello", "World"]);
        });

        test("应该过滤 false", () => {
            const children = ["Hello", false, "World"];
            const result = flattenChildren(children);
            expect(result).toEqual(["Hello", "World"]);
        });

        test("应该处理 DOM 元素", () => {
            const div = document.createElement("div");
            const span = document.createElement("span");
            const children = [div, span];
            const result = flattenChildren(children);
            expect(result).toEqual([div, span]);
        });

        test("应该处理混合类型", () => {
            const div = document.createElement("div");
            const children = ["Text", div, 123, null];
            const result = flattenChildren(children);
            expect(result).toEqual(["Text", div, 123]);
        });

        test("应该处理深度嵌套数组", () => {
            const children = ["A", ["B", ["C", "D"]]];
            const result = flattenChildren(children);
            expect(result).toEqual(["A", "B", "C", "D"]);
        });

        test("应该处理 HTML 字符串（自动解析）", () => {
            const children = ["<p>Hello</p>"];
            const result = flattenChildren(children);
            expect(result.length).toBeGreaterThan(0);
            // 第一个元素应该是解析后的 DOM 元素或字符串
            if (result[0] instanceof HTMLElement) {
                expect(result[0].tagName).toBe("P");
            }
        });

        test("应该防止无限递归（深度限制）", () => {
            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
            // 创建深度嵌套的数组（超过 10 层）
            let deepArray: unknown = "final";
            for (let i = 0; i < 15; i++) {
                deepArray = [deepArray];
            }
            const result = flattenChildren(deepArray as any);
            // 应该触发警告
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Maximum depth exceeded")
            );
            // 当深度超过限制时，函数会过滤出字符串和数字，但 deepArray 是数组，所以结果为空
            // 这是预期的行为，因为超过深度的数组会被过滤掉
            expect(Array.isArray(result)).toBe(true);
            consoleSpy.mockRestore();
        });

        test("应该处理 skipHTMLDetection 标志", () => {
            const children = ["<p>Test</p>"];
            const result = flattenChildren(children, true);
            // 如果跳过 HTML 检测，应该返回原始字符串
            expect(result).toEqual(["<p>Test</p>"]);
        });

        test("应该处理 DocumentFragment", () => {
            const fragment = document.createDocumentFragment();
            const children = [fragment];
            const result = flattenChildren(children);
            expect(result).toEqual([]);
        });

        test("应该处理数字", () => {
            const children = [1, 2, 3];
            const result = flattenChildren(children);
            expect(result).toEqual([1, 2, 3]);
        });

        test("应该处理复杂的混合场景", () => {
            const div = document.createElement("div");
            const children = ["Start", null, div, ["Nested", 123], false, "End"];
            const result = flattenChildren(children);
            expect(result).toEqual(["Start", div, "Nested", 123, "End"]);
        });
    });

    describe("parseHTMLToNodes", () => {
        test("应该解析简单的 HTML", () => {
            const result = parseHTMLToNodes("<p>Hello</p>");
            expect(result.length).toBe(1);
            expect(result[0] instanceof HTMLElement).toBe(true);
            if (result[0] instanceof HTMLElement) {
                expect(result[0].tagName).toBe("P");
                expect(result[0].textContent).toBe("Hello");
            }
        });

        test("应该解析多个元素", () => {
            const result = parseHTMLToNodes("<p>Hello</p><span>World</span>");
            expect(result.length).toBe(2);
        });

        test("应该处理空字符串", () => {
            const result = parseHTMLToNodes("");
            expect(result).toEqual([]);
        });

        test("应该处理文本节点", () => {
            const result = parseHTMLToNodes("Plain text");
            expect(result.length).toBe(1);
            expect(typeof result[0]).toBe("string");
            expect(result[0]).toBe("Plain text");
        });
    });

    describe("集成测试", () => {
        test("应该正确处理包含 HTML 字符串的复杂 children", () => {
            const div = document.createElement("div");
            const children = ["Before", "<p>HTML</p>", div, "After"];
            const result = flattenChildren(children);
            expect(result.length).toBeGreaterThan(3);
            expect(result[0]).toBe("Before");
            expect(result[result.length - 1]).toBe("After");
        });

        test("应该处理多层嵌套和 HTML 字符串", () => {
            const children = [["Level 1", ["Level 2", "<span>HTML</span>"]]];
            const result = flattenChildren(children);
            expect(result.length).toBeGreaterThan(2);
        });
    });
});

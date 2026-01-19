/**
 * Element Marking Tests
 *
 * Tests for element marking and identification utilities (RFC 0037).
 */

import {
    markElement,
    getElementCacheKey,
    isCreatedByH,
    shouldPreserveElement,
} from "../utils/element-marking";

describe("Element Marking", () => {
    describe("markElement", () => {
        test("应该标记 HTML 元素", () => {
            const element = document.createElement("div");
            markElement(element, "test-key-1");
            expect(getElementCacheKey(element)).toBe("test-key-1");
        });

        test("应该标记 SVG 元素", () => {
            const element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            markElement(element, "test-key-2");
            expect(getElementCacheKey(element)).toBe("test-key-2");
        });

        test("应该覆盖现有的标记", () => {
            const element = document.createElement("div");
            markElement(element, "old-key");
            markElement(element, "new-key");
            expect(getElementCacheKey(element)).toBe("new-key");
        });
    });

    describe("getElementCacheKey", () => {
        test("应该获取已标记元素的缓存键", () => {
            const element = document.createElement("div");
            markElement(element, "test-key-1");
            expect(getElementCacheKey(element)).toBe("test-key-1");
        });

        test("应该对未标记元素返回 null", () => {
            const element = document.createElement("div");
            expect(getElementCacheKey(element)).toBeNull();
        });

        test("应该处理空字符串键", () => {
            const element = document.createElement("div");
            markElement(element, "");
            expect(getElementCacheKey(element)).toBe("");
        });

        test("应该处理数字键（转换为字符串）", () => {
            const element = document.createElement("div");
            markElement(element, "123");
            expect(getElementCacheKey(element)).toBe("123");
        });
    });

    describe("isCreatedByH", () => {
        test("应该识别由 h() 创建的元素", () => {
            const element = document.createElement("div");
            markElement(element, "test-key");
            expect(isCreatedByH(element)).toBe(true);
        });

        test("应该识别未标记的元素（不是由 h() 创建）", () => {
            const element = document.createElement("div");
            expect(isCreatedByH(element)).toBe(false);
        });

        test("应该对文本节点返回 false", () => {
            const textNode = document.createTextNode("test");
            expect(isCreatedByH(textNode)).toBe(false);
        });

        test("应该对注释节点返回 false", () => {
            const commentNode = document.createComment("test");
            expect(isCreatedByH(commentNode)).toBe(false);
        });

        test("应该对 DocumentFragment 返回 false", () => {
            const fragment = document.createDocumentFragment();
            expect(isCreatedByH(fragment)).toBe(false);
        });

        test("应该识别 SVG 元素", () => {
            const element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            markElement(element, "test-key");
            expect(isCreatedByH(element)).toBe(true);
        });
    });

    describe("shouldPreserveElement", () => {
        test("应该保留文本节点", () => {
            const textNode = document.createTextNode("test");
            // 文本节点不应该被 shouldPreserveElement 自动保留，而是由框架管理
            expect(shouldPreserveElement(textNode)).toBe(false);
        });

        test("应该保留注释节点", () => {
            const commentNode = document.createComment("test");
            // 注释节点同理
            expect(shouldPreserveElement(commentNode)).toBe(false);
        });

        test("应该保留未标记的元素（自定义元素、第三方库注入）", () => {
            const element = document.createElement("div");
            expect(shouldPreserveElement(element)).toBe(true);
        });

        test("应该保留有 data-wsx-preserve 属性的元素", () => {
            const element = document.createElement("div");
            markElement(element, "test-key");
            element.setAttribute("data-wsx-preserve", "");
            expect(shouldPreserveElement(element)).toBe(true);
        });

        test("不应该保留由 h() 创建的元素（没有 data-wsx-preserve）", () => {
            const element = document.createElement("div");
            markElement(element, "test-key");
            expect(shouldPreserveElement(element)).toBe(false);
        });

        test("应该保留自定义元素（未标记）", () => {
            class CustomElement extends HTMLElement {}
            customElements.define("test-custom-element", CustomElement);
            const element = document.createElement("test-custom-element");
            expect(shouldPreserveElement(element)).toBe(true);
        });

        test("应该保留第三方库注入的元素（未标记）", () => {
            const element = document.createElement("div");
            // 模拟第三方库注入的元素（没有标记）
            element.className = "monaco-editor";
            expect(shouldPreserveElement(element)).toBe(true);
        });

        test("应该保留有 data-wsx-preserve 的已标记元素", () => {
            const element = document.createElement("div");
            markElement(element, "test-key");
            element.setAttribute("data-wsx-preserve", "true");
            expect(shouldPreserveElement(element)).toBe(true);
        });
    });

    describe("集成测试", () => {
        test("应该正确识别和标记元素链", () => {
            const parent = document.createElement("div");
            const child1 = document.createElement("span");
            const child2 = document.createElement("span");
            const unmarked = document.createElement("span");

            markElement(parent, "parent-key");
            markElement(child1, "child1-key");
            markElement(child2, "child2-key");
            // unmarked 不标记

            expect(isCreatedByH(parent)).toBe(true);
            expect(isCreatedByH(child1)).toBe(true);
            expect(isCreatedByH(child2)).toBe(true);
            expect(isCreatedByH(unmarked)).toBe(false);

            expect(shouldPreserveElement(parent)).toBe(false);
            expect(shouldPreserveElement(child1)).toBe(false);
            expect(shouldPreserveElement(child2)).toBe(false);
            expect(shouldPreserveElement(unmarked)).toBe(true);
        });

        test("应该处理混合场景（标记和未标记元素）", () => {
            const marked1 = document.createElement("div");
            const marked2 = document.createElement("div");
            const unmarked1 = document.createElement("div");
            const unmarked2 = document.createElement("div");

            markElement(marked1, "marked-1");
            markElement(marked2, "marked-2");

            expect(isCreatedByH(marked1)).toBe(true);
            expect(isCreatedByH(marked2)).toBe(true);
            expect(isCreatedByH(unmarked1)).toBe(false);
            expect(isCreatedByH(unmarked2)).toBe(false);

            expect(shouldPreserveElement(marked1)).toBe(false);
            expect(shouldPreserveElement(marked2)).toBe(false);
            expect(shouldPreserveElement(unmarked1)).toBe(true);
            expect(shouldPreserveElement(unmarked2)).toBe(true);
        });
    });
});

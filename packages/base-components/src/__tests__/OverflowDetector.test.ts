import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { OverflowDetector } from "../OverflowDetector";

describe("OverflowDetector", () => {
    let container: HTMLElement;
    let items: HTMLElement[];

    beforeEach(() => {
        container = document.createElement("div");
        container.style.width = "500px";
        container.style.height = "100px";
        document.body.appendChild(container);

        items = [];
        for (let i = 0; i < 5; i++) {
            const item = document.createElement("div");
            item.style.width = "100px";
            item.style.height = "50px";
            item.style.display = "inline-block";
            item.textContent = `Item ${i}`;
            container.appendChild(item);
            // 在 jsdom 中，需要手动设置 offsetWidth
            Object.defineProperty(item, "offsetWidth", {
                configurable: true,
                value: 100,
            });
            items.push(item);
        }
        // 设置容器的 offsetWidth
        Object.defineProperty(container, "offsetWidth", {
            configurable: true,
            value: 500,
        });
    });

    afterEach(() => {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    });

    describe("detect", () => {
        it("应该返回空数组当容器或项为空时", () => {
            const result1 = OverflowDetector.detect({
                container: null as unknown as HTMLElement,
                items: [],
            });
            expect(result1.visibleIndices).toEqual([]);
            expect(result1.hiddenIndices).toEqual([]);
            expect(result1.needsOverflow).toBe(false);

            const result2 = OverflowDetector.detect({
                container,
                items: [],
            });
            expect(result2.visibleIndices).toEqual([]);
            expect(result2.hiddenIndices).toEqual([]);
            expect(result2.needsOverflow).toBe(false);
        });

        it("应该显示所有项当空间足够时", () => {
            const result = OverflowDetector.detect({
                container,
                items,
                gap: 0,
            });
            expect(result.visibleIndices).toEqual([0, 1, 2, 3, 4]);
            expect(result.hiddenIndices).toEqual([]);
            expect(result.needsOverflow).toBe(false);
        });

        it("应该隐藏部分项当空间不足时", () => {
            container.style.width = "250px"; // 只能容纳2个项
            Object.defineProperty(container, "offsetWidth", {
                configurable: true,
                value: 250,
            });
            const result = OverflowDetector.detect({
                container,
                items,
                gap: 0,
            });
            expect(result.visibleIndices.length).toBeGreaterThan(0);
            expect(result.hiddenIndices.length).toBeGreaterThan(0);
            expect(result.needsOverflow).toBe(true);
        });

        it("应该考虑 gap 参数", () => {
            container.style.width = "220px"; // 2个项 + gap
            Object.defineProperty(container, "offsetWidth", {
                configurable: true,
                value: 220,
            });
            const result = OverflowDetector.detect({
                container,
                items,
                gap: 20,
            });
            expect(result.visibleIndices.length).toBeLessThanOrEqual(2);
        });

        it("应该考虑 reservedWidth 参数", () => {
            container.style.width = "500px";
            const result = OverflowDetector.detect({
                container,
                items,
                reservedWidth: 300,
                gap: 0,
            });
            expect(result.visibleIndices.length).toBeLessThan(5);
        });

        it("应该考虑 overflowButtonWidth 参数", () => {
            container.style.width = "250px"; // 2.5个项，需要 overflow
            Object.defineProperty(container, "offsetWidth", {
                configurable: true,
                value: 250,
            });
            const result = OverflowDetector.detect({
                container,
                items,
                overflowButtonWidth: 50,
                gap: 0,
            });
            expect(result.needsOverflow).toBe(true);
        });

        it("应该考虑 padding 参数", () => {
            container.style.width = "500px";
            const result = OverflowDetector.detect({
                container,
                items,
                padding: 50,
                gap: 0,
            });
            expect(result.visibleIndices.length).toBeLessThan(5);
        });

        it("应该确保至少显示 minVisibleItems 个项", () => {
            container.style.width = "50px"; // 非常小的容器
            const result = OverflowDetector.detect({
                container,
                items,
                minVisibleItems: 2,
                gap: 0,
            });
            expect(result.visibleIndices.length).toBeGreaterThanOrEqual(2);
        });

        it("应该处理宽度为0的元素", () => {
            const zeroWidthItem = document.createElement("div");
            zeroWidthItem.style.width = "0px";
            const itemsWithZero = [items[0], zeroWidthItem, items[1]];

            const result = OverflowDetector.detect({
                container,
                items: itemsWithZero,
                gap: 0,
            });
            expect(result.visibleIndices).toContain(1); // 宽度为0的项应该被包含
        });

        it("应该处理不存在的元素", () => {
            const itemsWithNull = [items[0], null as unknown as HTMLElement, items[1]];

            const result = OverflowDetector.detect({
                container,
                items: itemsWithNull,
                gap: 0,
            });
            expect(result.visibleIndices.length).toBeGreaterThan(0);
        });

        it("应该处理宽度为0的元素在 overflow 场景", () => {
            container.style.width = "150px";
            Object.defineProperty(container, "offsetWidth", {
                configurable: true,
                value: 150,
            });
            const zeroWidthItem = document.createElement("div");
            Object.defineProperty(zeroWidthItem, "offsetWidth", {
                configurable: true,
                value: 0,
            });
            const itemsWithZero = [items[0], zeroWidthItem, items[1], items[2]];
            container.appendChild(zeroWidthItem);

            const result = OverflowDetector.detect({
                container,
                items: itemsWithZero,
                overflowButtonWidth: 50,
                minVisibleItems: 2,
                gap: 0,
            });
            // 应该至少显示 minVisibleItems 个项
            expect(result.visibleIndices.length).toBeGreaterThanOrEqual(2);
            container.removeChild(zeroWidthItem);
        });

        it("应该强制显示 minVisibleItems 个项", () => {
            container.style.width = "50px"; // 非常小的容器
            Object.defineProperty(container, "offsetWidth", {
                configurable: true,
                value: 50,
            });
            const result = OverflowDetector.detect({
                container,
                items,
                minVisibleItems: 3,
                gap: 0,
            });
            expect(result.visibleIndices.length).toBeGreaterThanOrEqual(3);
        });

        it("应该处理宽度为0的元素在 minVisibleItems 场景", () => {
            container.style.width = "50px";
            Object.defineProperty(container, "offsetWidth", {
                configurable: true,
                value: 50,
            });
            const zeroWidthItem1 = document.createElement("div");
            Object.defineProperty(zeroWidthItem1, "offsetWidth", {
                configurable: true,
                value: 0,
            });
            const zeroWidthItem2 = document.createElement("div");
            Object.defineProperty(zeroWidthItem2, "offsetWidth", {
                configurable: true,
                value: 0,
            });
            const itemsWithZero = [zeroWidthItem1, items[0], zeroWidthItem2];
            container.appendChild(zeroWidthItem1);
            container.appendChild(zeroWidthItem2);

            const result = OverflowDetector.detect({
                container,
                items: itemsWithZero,
                minVisibleItems: 2,
                gap: 0,
            });
            // 当 visibleIndices.length < minVisibleItems 时，应该从 hiddenIndices 中取出
            expect(result.visibleIndices.length).toBeGreaterThanOrEqual(2);
            container.removeChild(zeroWidthItem1);
            container.removeChild(zeroWidthItem2);
        });

        it("应该处理宽度为0的元素在 overflow 场景中 visibleIndices.length >= minVisibleItems", () => {
            container.style.width = "50px";
            Object.defineProperty(container, "offsetWidth", {
                configurable: true,
                value: 50,
            });
            const zeroWidthItem = document.createElement("div");
            Object.defineProperty(zeroWidthItem, "offsetWidth", {
                configurable: true,
                value: 0,
            });
            const itemsWithZero = [items[0], zeroWidthItem, items[1]];
            container.appendChild(zeroWidthItem);

            const result = OverflowDetector.detect({
                container,
                items: itemsWithZero,
                overflowButtonWidth: 50,
                minVisibleItems: 1,
                gap: 0,
            });
            // 当 visibleIndices.length >= minVisibleItems 时，宽度为0的项应该被隐藏
            expect(result.visibleIndices.length).toBeGreaterThanOrEqual(1);
            container.removeChild(zeroWidthItem);
        });
    });

    describe("calculateTotalWidth", () => {
        it("应该返回0当数组为空时", () => {
            expect(OverflowDetector.calculateTotalWidth([])).toBe(0);
        });

        it("应该计算所有项的宽度", () => {
            const total = OverflowDetector.calculateTotalWidth(items, 0);
            expect(total).toBe(500); // 5 * 100px
        });

        it("应该考虑 gap 参数", () => {
            const total = OverflowDetector.calculateTotalWidth(items, 10);
            expect(total).toBe(540); // 5 * 100px + 4 * 10px (gap)
        });

        it("应该处理宽度为0的项", () => {
            const zeroWidthItem = document.createElement("div");
            Object.defineProperty(zeroWidthItem, "offsetWidth", {
                configurable: true,
                value: 0,
            });
            const itemsWithZero = [items[0], zeroWidthItem];
            const total = OverflowDetector.calculateTotalWidth(itemsWithZero, 0);
            expect(total).toBe(100); // 只有第一个项有宽度
        });
    });

    describe("getElementTotalWidth", () => {
        it("应该返回0当元素不存在时", () => {
            expect(OverflowDetector.getElementTotalWidth(null as unknown as HTMLElement)).toBe(0);
        });

        it("应该返回元素的 offsetWidth", () => {
            const item = document.createElement("div");
            Object.defineProperty(item, "offsetWidth", {
                configurable: true,
                value: 100,
            });
            // Mock getComputedStyle
            const originalGetComputedStyle = window.getComputedStyle;
            window.getComputedStyle = () => {
                return {
                    marginLeft: "0px",
                    marginRight: "0px",
                } as CSSStyleDeclaration;
            };
            const width = OverflowDetector.getElementTotalWidth(item);
            expect(width).toBe(100);
            window.getComputedStyle = originalGetComputedStyle;
        });

        it("应该包括 margin", () => {
            const item = document.createElement("div");
            Object.defineProperty(item, "offsetWidth", {
                configurable: true,
                value: 100,
            });
            // Mock getComputedStyle
            const originalGetComputedStyle = window.getComputedStyle;
            window.getComputedStyle = () => {
                return {
                    marginLeft: "10px",
                    marginRight: "10px",
                } as CSSStyleDeclaration;
            };
            const width = OverflowDetector.getElementTotalWidth(item);
            expect(width).toBe(120); // 100 + 10 + 10
            window.getComputedStyle = originalGetComputedStyle;
        });
    });
});

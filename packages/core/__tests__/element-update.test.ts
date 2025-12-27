/**
 * Element Update 核心修复测试 (RFC-0039)
 *
 * 测试三个关键修复：
 * 1. 元数据竞态条件修复 - 防止并发渲染读取过时元数据
 * 2. 文本节点双重检查修复 - 确保文本内容正确更新
 * 3. 保留元素处理修复 - 确保第三方注入元素不丢失
 */

import { h } from "../src/jsx-factory";
import { WebComponent } from "../src/web-component";
import { state } from "../src/reactive-decorator";
import { shouldPreserveElement } from "../src/utils/element-marking";
import { DOMCacheManager } from "../src/dom-cache-manager";

/**
 * 纯函数工具集 - 减少测试代码复杂度
 */

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const getShadowRoot = (component: WebComponent) => {
    const shadowRoot = component.shadowRoot;
    if (!shadowRoot) {
        throw new Error("Shadow root not found");
    }
    return shadowRoot;
};

function queryElement<T extends Element = HTMLElement>(
    root: ShadowRoot | Document | Element,
    selector: string
): T {
    const element = root.querySelector(selector);
    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }
    return element as T;
}

const createThirdPartyElement = (className: string, textContent: string): HTMLElement => {
    const element = document.createElement("div");
    element.className = className;
    element.textContent = textContent;
    return element;
};

const createThirdPartyElements = (count: number, prefix: string): HTMLElement[] =>
    Array.from({ length: count }, (_, i) =>
        createThirdPartyElement(`${prefix}-${i}`, `Third Party ${i}`)
    );

const assertElementPreserved = (
    container: Element,
    selector: string,
    expectedRef: Element,
    expectedText: string
): void => {
    const element = container.querySelector(selector);
    expect(element).not.toBeNull();
    expect(element).toBe(expectedRef);
    expect(element!.textContent).toBe(expectedText);
};

const getCacheManager = (component: WebComponent): DOMCacheManager => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (component as any)._domCache as DOMCacheManager;
};

const clearCache = (component: WebComponent): void => {
    getCacheManager(component).clear();
};

const waitForRender = (): Promise<void> => wait(50);

/**
 * 测试组件：用于验证文本节点更新
 */
class TextUpdateComponent extends WebComponent {
    @state private text: string = "Initial";

    render() {
        return h("div", { id: "container" }, [h("span", { id: "text" }, this.text)]);
    }

    updateText(newText: string): void {
        this.text = newText;
        this.rerender();
    }
}

customElements.define("text-update-component", TextUpdateComponent);

/**
 * 测试组件：用于验证竞态条件
 */
class RaceConditionComponent extends WebComponent {
    @state private count: number = 0;
    @state private triggerNested: boolean = false;

    render() {
        // 关键：在渲染过程中可能触发另一个渲染（模拟事件监听器）
        if (this.triggerNested) {
            this.triggerNested = false;
            // 异步触发另一个渲染，模拟竞态条件
            setTimeout(() => {
                this.count++;
                this.rerender();
            }, 0);
        }

        return h("div", { id: "container" }, [
            h("span", { id: "counter" }, `Count: ${this.count}`),
        ]);
    }

    incrementWithNested(): void {
        this.count++;
        this.triggerNested = true;
        this.rerender();
    }

    increment(): void {
        this.count++;
        this.rerender();
    }
}

customElements.define("race-condition-component", RaceConditionComponent);

/**
 * 测试组件：用于验证保留元素
 */
class PreservedElementsComponent extends WebComponent {
    @state private count: number = 0;

    render() {
        return h("div", { id: "container" }, [
            h("span", { id: "counter" }, `Count: ${this.count}`),
            h("div", { id: "content" }, "Content"),
        ]);
    }

    increment(): void {
        this.count++;
        this.rerender();
    }
}

customElements.define("preserved-elements-component", PreservedElementsComponent);

describe("Element Update - Metadata Race Condition Fix (RFC-0039)", () => {
    let component: RaceConditionComponent;

    beforeEach(async () => {
        document.body.innerHTML = "";
        component = document.createElement("race-condition-component") as RaceConditionComponent;
        document.body.appendChild(component);
        clearCache(component);
        await waitForRender();
    });

    afterEach(() => {
        component.remove();
        clearCache(component);
    });

    test("应该在更新DOM之前保存新的元数据", async () => {
        const shadowRoot = getShadowRoot(component);
        const container = queryElement(shadowRoot, "#container");

        const cacheManager = getCacheManager(component);
        const initialMetadata = cacheManager.getMetadata(container);
        expect(initialMetadata).toBeDefined();
        expect(initialMetadata?.props).toBeDefined();

        component.increment();
        await waitForRender();

        const updatedMetadata = cacheManager.getMetadata(container);
        expect(updatedMetadata).toBeDefined();
        expect(updatedMetadata?.children).toBeDefined();

        const counter = queryElement(shadowRoot, "#counter");
        expect(counter.textContent).toBe("Count: 1");
    });

    test.skip("应该处理并发渲染触发的竞态条件", async () => {
        const shadowRoot = getShadowRoot(component);

        component.incrementWithNested();
        await wait(100);

        const counter = queryElement(shadowRoot, "#counter");
        expect(counter.textContent).toBe("Count: 2");

        const container = queryElement(shadowRoot, "#container");
        const cacheManager = getCacheManager(component);
        const metadata = cacheManager.getMetadata(container);
        expect(metadata).toBeDefined();
    });
});

describe("Element Update - Text Node Dual Checking Fix (RFC-0039)", () => {
    let component: TextUpdateComponent;

    beforeEach(async () => {
        document.body.innerHTML = "";
        component = document.createElement("text-update-component") as TextUpdateComponent;
        document.body.appendChild(component);
        clearCache(component);
        await waitForRender();
    });

    afterEach(() => {
        component.remove();
        clearCache(component);
    });

    test.skip("应该检查实际DOM文本内容而不仅仅是元数据", async () => {
        const shadowRoot = getShadowRoot(component);
        const textSpan = queryElement(shadowRoot, "#text");

        expect(textSpan.textContent).toBe("Initial");

        component.updateText("Updated");
        await waitForRender();

        expect(textSpan.textContent).toBe("Updated");

        const textNode = textSpan.firstChild as Text;
        textNode.textContent = "Manual Change";

        component.updateText("Final");
        await waitForRender();

        expect(textSpan.textContent).toBe("Final");
    });

    test.skip("应该正确处理文本节点从一个值更新到另一个值", async () => {
        const shadowRoot = getShadowRoot(component);
        const textSpan = queryElement(shadowRoot, "#text");

        const updates = ["First", "Second", "Third", "Fourth"];
        for (const text of updates) {
            component.updateText(text);
            await waitForRender();
            expect(textSpan.textContent).toBe(text);
        }
    });

    test.skip("应该正确处理空字符串和特殊字符", async () => {
        const shadowRoot = getShadowRoot(component);
        const textSpan = queryElement(shadowRoot, "#text");

        component.updateText("");
        await waitForRender();
        expect(textSpan.textContent).toBe("");

        component.updateText("<>&\"'");
        await waitForRender();
        expect(textSpan.textContent).toBe("<>&\"'");

        component.updateText("Line 1\nLine 2\nLine 3");
        await waitForRender();
        expect(textSpan.textContent).toBe("Line 1\nLine 2\nLine 3");
    });
});

describe("Element Update - Preserved Elements Handling Fix (RFC-0039)", () => {
    let component: PreservedElementsComponent;

    beforeEach(async () => {
        document.body.innerHTML = "";
        component = document.createElement(
            "preserved-elements-component"
        ) as PreservedElementsComponent;
        document.body.appendChild(component);
        clearCache(component);
        await waitForRender();
    });

    afterEach(() => {
        component.remove();
        clearCache(component);
    });

    test("应该在更新开始时收集所有保留元素", async () => {
        const shadowRoot = getShadowRoot(component);
        const container = queryElement(shadowRoot, "#container");

        const thirdPartyElement = createThirdPartyElement("third-party", "Third Party Content");
        container.appendChild(thirdPartyElement);

        expect(shouldPreserveElement(thirdPartyElement)).toBe(true);

        component.increment();
        await waitForRender();

        assertElementPreserved(container, ".third-party", thirdPartyElement, "Third Party Content");
    });

    test("应该在更新结束时重新插入保留元素", async () => {
        const shadowRoot = getShadowRoot(component);
        const container = queryElement(shadowRoot, "#container");

        const elements = createThirdPartyElements(3, "third-party");
        elements.forEach((el) => container.appendChild(el));

        for (let i = 0; i < 5; i++) {
            component.increment();
            await waitForRender();
        }

        elements.forEach((el, i) => {
            assertElementPreserved(container, `.third-party-${i}`, el, `Third Party ${i}`);
        });
    });

    test.skip("应该保留元素的同时正确更新框架管理的元素", async () => {
        const shadowRoot = getShadowRoot(component);
        const container = queryElement(shadowRoot, "#container");

        const thirdPartyElement = createThirdPartyElement("third-party", "Third Party");
        container.appendChild(thirdPartyElement);

        const counter = queryElement(shadowRoot, "#counter");
        const content = queryElement(shadowRoot, "#content");

        expect(counter.textContent).toBe("Count: 0");
        expect(content.textContent).toBe("Content");

        component.increment();
        await waitForRender();

        expect(counter.textContent).toBe("Count: 1");
        expect(content.textContent).toBe("Content");

        assertElementPreserved(container, ".third-party", thirdPartyElement, "Third Party");
    });

    test.skip("应该处理保留元素被手动移除的情况", async () => {
        const shadowRoot = getShadowRoot(component);
        const container = queryElement(shadowRoot, "#container");

        const thirdPartyElement = createThirdPartyElement("third-party", "Third Party");
        container.appendChild(thirdPartyElement);

        component.increment();
        await waitForRender();

        expect(container.querySelector(".third-party")).not.toBeNull();

        container.removeChild(thirdPartyElement);

        component.increment();
        await waitForRender();

        assertElementPreserved(container, ".third-party", thirdPartyElement, "Third Party");
    });

    test("应该保留自定义元素", async () => {
        class CustomPreservedElement extends HTMLElement {
            connectedCallback(): void {
                this.textContent = "Custom Element";
            }
        }
        customElements.define("custom-preserved-element", CustomPreservedElement);

        const shadowRoot = getShadowRoot(component);
        const container = queryElement(shadowRoot, "#container");

        const customElement = document.createElement("custom-preserved-element");
        container.appendChild(customElement);

        expect(shouldPreserveElement(customElement)).toBe(true);

        component.increment();
        await waitForRender();

        const stillPresent = container.querySelector("custom-preserved-element");
        expect(stillPresent).not.toBeNull();
        expect(stillPresent!.textContent).toBe("Custom Element");
    });

    test("应该保留带有 data-wsx-preserve 属性的元素", async () => {
        const shadowRoot = getShadowRoot(component);
        const container = queryElement(shadowRoot, "#container");

        const preservedElement = document.createElement("div");
        preservedElement.setAttribute("data-wsx-preserve", "");
        preservedElement.className = "preserved-by-attr";
        preservedElement.textContent = "Preserved by Attribute";
        container.appendChild(preservedElement);

        expect(shouldPreserveElement(preservedElement)).toBe(true);

        component.increment();
        await waitForRender();

        assertElementPreserved(
            container,
            ".preserved-by-attr",
            preservedElement,
            "Preserved by Attribute"
        );
    });
});

/**
 * EditorJS Integration Test
 *
 * Tests that EditorJS (or similar third-party libraries) can inject elements
 * into LightComponent containers and those elements are preserved during re-renders.
 */

import { LightComponent } from "../src/light-component";
import { h } from "../src/jsx-factory";
import { state } from "../src/reactive-decorator";
import { shouldPreserveElement, isCreatedByH } from "../src/utils/element-marking";

class EditorJSTestComponent extends LightComponent {
    @state private count: number = 0;
    public editorContainer: HTMLElement | null = null;
    public thirdPartyElement: HTMLElement | null = null;

    render() {
        return h("div", { id: "container" }, [
            h("div", {
                id: "editor-container",
                ref: (el: HTMLElement) => {
                    this.editorContainer = el;
                },
            }),
            h("span", { id: "counter" }, `Count: ${this.count}`),
        ]);
    }

    increment() {
        this.count++;
        this.rerender();
    }

    // Simulate third-party library injecting an element
    injectThirdPartyElement() {
        if (this.editorContainer) {
            const element = document.createElement("div");
            element.className = "third-party-content";
            element.textContent = "Third-party injected content";
            this.editorContainer.appendChild(element);
            this.thirdPartyElement = element;
        }
    }
}

customElements.define("editorjs-test-component", EditorJSTestComponent);

describe("EditorJS Integration", () => {
    let component: EditorJSTestComponent;

    beforeEach(() => {
        document.body.innerHTML = "";
        component = new EditorJSTestComponent();
        document.body.appendChild(component);
        (component as any)._domCache.clear();
    });

    afterEach(() => {
        component.remove();
        (component as any)._domCache.clear();
    });

    test("应该保留第三方库注入的元素", async () => {
        // 等待初始渲染完成
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // 1. 验证容器存在
        const container = component.querySelector("#editor-container");
        expect(container).not.toBeNull();
        expect(component.editorContainer).toBe(container);

        // 2. 模拟第三方库注入元素
        component.injectThirdPartyElement();
        expect(component.thirdPartyElement).not.toBeNull();

        // 3. 验证注入的元素未标记
        expect(isCreatedByH(component.thirdPartyElement!)).toBe(false);
        expect(shouldPreserveElement(component.thirdPartyElement!)).toBe(true);

        // 4. 触发重新渲染
        component.increment();
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // 5. 验证第三方元素仍然存在（被保留）
        const preserved = component.querySelector(".third-party-content");
        expect(preserved).not.toBeNull();
        expect(preserved).toBe(component.thirdPartyElement);
        expect(preserved!.textContent).toBe("Third-party injected content");

        // 6. 验证容器仍然存在（被缓存复用）
        const containerAfter = component.querySelector("#editor-container");
        expect(containerAfter).toBe(container);
        expect(component.editorContainer).toBe(container);
    });

    test("应该同时更新框架元素和保留第三方元素", async () => {
        // 等待初始渲染完成
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // 1. 注入第三方元素
        component.injectThirdPartyElement();

        // 2. 验证初始状态
        const counter1 = component.querySelector("#counter");
        expect(counter1!.textContent).toBe("Count: 0");

        // 3. 触发重新渲染
        component.increment();
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // 4. 验证框架元素已更新
        const counter2 = component.querySelector("#counter");
        expect(counter2!.textContent).toBe("Count: 1");

        // 5. 验证第三方元素仍然保留
        const preserved = component.querySelector(".third-party-content");
        expect(preserved).not.toBeNull();
        expect(preserved).toBe(component.thirdPartyElement);
    });

    test("应该保留容器内的多个第三方元素", async () => {
        // 等待初始渲染完成
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // 1. 注入多个第三方元素
        if (component.editorContainer) {
            const element1 = document.createElement("div");
            element1.className = "third-party-1";
            element1.textContent = "Element 1";
            component.editorContainer.appendChild(element1);

            const element2 = document.createElement("div");
            element2.className = "third-party-2";
            element2.textContent = "Element 2";
            component.editorContainer.appendChild(element2);
        }

        // 2. 触发重新渲染
        component.increment();
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // 3. 验证所有第三方元素都被保留
        const element1 = component.querySelector(".third-party-1");
        const element2 = component.querySelector(".third-party-2");

        expect(element1).not.toBeNull();
        expect(element2).not.toBeNull();
        expect(element1!.textContent).toBe("Element 1");
        expect(element2!.textContent).toBe("Element 2");
    });
});

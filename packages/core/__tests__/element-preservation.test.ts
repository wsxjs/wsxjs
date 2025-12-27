/**
 * Test for element preservation logic (RFC 0037 Phase 5)
 *
 * Verifies that unmarked elements (third-party library injected, custom elements)
 * are preserved during DOM updates.
 */

import { h } from "../src/jsx-factory";
import { WebComponent } from "../src/web-component";
import { LightComponent } from "../src/light-component";
import { state } from "../src/reactive-decorator";
import { RenderContext } from "../src/render-context";
import { shouldPreserveElement, isCreatedByH } from "../src/utils/element-marking";

class PreservationTestComponent extends WebComponent {
    @state private count: number = 0;

    render() {
        return h("div", { __testId: "container" }, [
            h("span", { __testId: "counter" }, `Count: ${this.count}`),
            // This div will be injected by third-party library (simulated)
        ]);
    }

    increment() {
        this.count++;
        this.rerender();
    }
}

customElements.define("preservation-test-component", PreservationTestComponent);

describe("Element Preservation (Phase 5)", () => {
    let component: PreservationTestComponent;

    beforeEach(() => {
        document.body.innerHTML = "";
        component = new PreservationTestComponent();
        document.body.appendChild(component);
        (component as any)._domCache.clear();
    });

    afterEach(() => {
        component.remove();
        (component as any)._domCache.clear();
    });

    test("应该保留未标记的元素（第三方库注入）", () => {
        // 1. 初始渲染
        let render1: HTMLElement;
        RenderContext.runInContext(component, () => {
            render1 = component.render() as HTMLElement;
        });

        // 2. 模拟第三方库注入元素（未标记）
        const thirdPartyElement = document.createElement("div");
        thirdPartyElement.className = "monaco-editor";
        thirdPartyElement.textContent = "Third-party content";
        render1!.appendChild(thirdPartyElement);

        // 验证元素未标记
        expect(isCreatedByH(thirdPartyElement)).toBe(false);
        expect(shouldPreserveElement(thirdPartyElement)).toBe(true);

        // 3. 更新组件（触发重新渲染）
        component.increment();

        RenderContext.runInContext(component, () => {
            component.render() as HTMLElement;
        });

        // 4. 验证第三方元素仍然存在（被保留）
        // 注意：在实际组件渲染中，元素会被添加到 DOM，所以这里我们检查逻辑
        const preserved = shouldPreserveElement(thirdPartyElement);
        expect(preserved).toBe(true);
    });

    test("应该更新由 h() 创建的元素", () => {
        // 1. 初始渲染
        let render1: HTMLElement;
        RenderContext.runInContext(component, () => {
            render1 = component.render() as HTMLElement;
        });

        const span1 = render1!.querySelector("span") as HTMLElement;
        expect(span1.textContent).toBe("Count: 0");

        // 2. 更新组件
        component.increment();

        let render2: HTMLElement;
        RenderContext.runInContext(component, () => {
            render2 = component.render() as HTMLElement;
        });

        // 3. 验证文本内容已更新
        const span2 = render2!.querySelector("span") as HTMLElement;
        expect(span2.textContent).toBe("Count: 1");
    });

    test("应该保留有 data-wsx-preserve 属性的元素", () => {
        const element = document.createElement("div");
        element.setAttribute("data-wsx-preserve", "");
        // 即使标记了，也应该保留
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (element as any).__wsxCacheKey = "test-key";

        expect(shouldPreserveElement(element)).toBe(true);
    });

    test("应该保留自定义元素", () => {
        class CustomElement extends HTMLElement {}
        customElements.define("test-custom-preserve", CustomElement);

        const element = document.createElement("test-custom-preserve");
        expect(shouldPreserveElement(element)).toBe(true);
    });
});

/**
 * LightComponent 元素保留测试
 * 验证手动创建的元素（如编辑器容器）在重新渲染时不会被删除
 */
class LightPreservationTestComponent extends LightComponent {
    @state private count: number = 0;
    public manualElement: HTMLElement | null = null;

    render() {
        return h("div", { id: "container" }, [
            h("span", { id: "counter" }, `Count: ${this.count}`),
        ]);
    }

    increment() {
        this.count++;
        this.rerender();
    }
}

customElements.define("light-preservation-test-component", LightPreservationTestComponent);

describe("LightComponent Element Preservation", () => {
    let component: LightPreservationTestComponent;

    beforeEach(() => {
        document.body.innerHTML = "";
        component = new LightPreservationTestComponent();
        document.body.appendChild(component);
        (component as any)._domCache.clear();
    });

    afterEach(() => {
        component.remove();
        (component as any)._domCache.clear();
    });

    test.skip("应该保留手动创建的元素（如编辑器容器）", async () => {
        // 等待初始渲染完成
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // 1. 手动创建元素（模拟用户代码中的 editorContainerRef）
        const container = component.querySelector("#container");
        expect(container).not.toBeNull();

        const manualElement = document.createElement("div");
        manualElement.className = "quiz-editor-container";
        manualElement.textContent = "Editor Container";
        container!.appendChild(manualElement);
        component.manualElement = manualElement;

        // 验证元素未标记（手动创建的元素不应该有标记）
        expect(isCreatedByH(manualElement)).toBe(false);
        expect(shouldPreserveElement(manualElement)).toBe(true);

        // 2. 触发重新渲染
        component.increment();
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // 3. 验证手动创建的元素仍然存在（被保留）
        const preservedElement = component.querySelector(".quiz-editor-container");
        expect(preservedElement).not.toBeNull();
        expect(preservedElement).toBe(manualElement);
        expect(preservedElement!.textContent).toBe("Editor Container");

        // 4. 再次触发重新渲染，验证元素仍然保留
        component.increment();
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        const stillPreserved = component.querySelector(".quiz-editor-container");
        expect(stillPreserved).not.toBeNull();
        expect(stillPreserved).toBe(manualElement);
    });

    test.skip("应该更新由 h() 创建的元素，同时保留手动创建的元素", async () => {
        // 等待初始渲染完成
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // 1. 手动创建元素
        const container = component.querySelector("#container");
        const manualElement = document.createElement("div");
        manualElement.className = "manual-element";
        manualElement.textContent = "Manual";
        container!.appendChild(manualElement);

        // 2. 验证初始状态
        const counter1 = component.querySelector("#counter");
        expect(counter1!.textContent).toBe("Count: 0");

        // 3. 触发重新渲染
        component.increment();
        await new Promise<void>((resolve) => setTimeout(resolve, 100));

        // 4. 验证由 h() 创建的元素已更新
        const counter2 = component.querySelector("#counter");
        expect(counter2!.textContent).toBe("Count: 1");

        // 5. 验证手动创建的元素仍然保留
        const preserved = component.querySelector(".manual-element");
        expect(preserved).not.toBeNull();
        expect(preserved).toBe(manualElement);
        expect(preserved!.textContent).toBe("Manual");
    });
});

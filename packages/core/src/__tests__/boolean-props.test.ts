/**
 * Boolean Props Removal Fix Test
 *
 * 测试布尔属性为 false 时正确移除属性的修复
 * 修复问题：当布尔属性（如 checked, disabled, readonly, selected）从 true 变为 false 时，
 * 应该移除 DOM 属性，而不是保留属性。
 *
 * 测试目标：
 * - src/utils/element-update.ts 中的 applySingleProp 函数
 * - src/utils/element-creation.ts 中的 applySingleProp 函数
 */

import { h } from "../jsx-factory";
import { WebComponent } from "../web-component";
import { state } from "../reactive-decorator";

/**
 * 纯函数工具集
 */
const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

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

const waitForRender = (): Promise<void> => wait(100);

/**
 * 测试组件：用于验证布尔属性更新
 */
class BooleanPropsComponent extends WebComponent {
    @state private checked: boolean = false;
    @state private disabled: boolean = false;
    @state private readonly: boolean = false;
    @state private selected: boolean = false;

    render() {
        return h("div", { id: "container" }, [
            h("input", {
                type: "radio",
                id: "radio",
                checked: this.checked,
            }),
            h("input", {
                type: "checkbox",
                id: "checkbox",
                checked: this.checked,
            }),
            h("input", {
                type: "text",
                id: "text-input",
                disabled: this.disabled,
                readonly: this.readonly,
            }),
            h(
                "option",
                {
                    id: "option",
                    selected: this.selected,
                },
                "Option"
            ),
        ]);
    }

    setChecked(value: boolean): void {
        this.checked = value;
        this.rerender();
    }

    setDisabled(value: boolean): void {
        this.disabled = value;
        this.rerender();
    }

    setReadonly(value: boolean): void {
        this.readonly = value;
        this.rerender();
    }

    setSelected(value: boolean): void {
        this.selected = value;
        this.rerender();
    }
}

customElements.define("boolean-props-component", BooleanPropsComponent);

describe("Boolean Props Removal Fix", () => {
    let component: BooleanPropsComponent;

    beforeEach(async () => {
        document.body.innerHTML = "";
        component = document.createElement("boolean-props-component") as BooleanPropsComponent;
        document.body.appendChild(component);
        await waitForRender();
    });

    afterEach(() => {
        component.remove();
    });

    test("应该移除 radio button 的 checked 属性当值变为 false", async () => {
        const shadowRoot = getShadowRoot(component);
        const radio = queryElement<HTMLInputElement>(shadowRoot, "#radio");

        // 初始状态：未选中
        expect(radio.hasAttribute("checked")).toBe(false);
        expect(radio.checked).toBe(false);

        // 设置为选中
        component.setChecked(true);
        await waitForRender();

        expect(radio.hasAttribute("checked")).toBe(true);
        expect(radio.checked).toBe(true);

        // 取消选中：应该移除 checked 属性
        component.setChecked(false);
        await waitForRender();

        expect(radio.hasAttribute("checked")).toBe(false);
        expect(radio.checked).toBe(false);
    });

    test("应该移除 checkbox 的 checked 属性当值变为 false", async () => {
        const shadowRoot = getShadowRoot(component);
        const checkbox = queryElement<HTMLInputElement>(shadowRoot, "#checkbox");

        // 初始状态：未选中
        expect(checkbox.hasAttribute("checked")).toBe(false);
        expect(checkbox.checked).toBe(false);

        // 设置为选中
        component.setChecked(true);
        await waitForRender();

        expect(checkbox.hasAttribute("checked")).toBe(true);
        expect(checkbox.checked).toBe(true);

        // 取消选中：应该移除 checked 属性
        component.setChecked(false);
        await waitForRender();

        expect(checkbox.hasAttribute("checked")).toBe(false);
        expect(checkbox.checked).toBe(false);
    });

    test("应该移除 input 的 disabled 属性当值变为 false", async () => {
        const shadowRoot = getShadowRoot(component);
        const input = queryElement<HTMLInputElement>(shadowRoot, "#text-input");

        // 初始状态：未禁用
        expect(input.hasAttribute("disabled")).toBe(false);
        expect(input.disabled).toBe(false);

        // 设置为禁用
        component.setDisabled(true);
        await waitForRender();

        expect(input.hasAttribute("disabled")).toBe(true);
        expect(input.disabled).toBe(true);

        // 取消禁用：应该移除 disabled 属性
        component.setDisabled(false);
        await waitForRender();

        expect(input.hasAttribute("disabled")).toBe(false);
        expect(input.disabled).toBe(false);
    });

    test("应该移除 input 的 readonly 属性当值变为 false", async () => {
        const shadowRoot = getShadowRoot(component);
        const input = queryElement<HTMLInputElement>(shadowRoot, "#text-input");

        // 初始状态：可编辑
        expect(input.hasAttribute("readonly")).toBe(false);
        expect(input.readOnly).toBe(false);

        // 设置为只读
        component.setReadonly(true);
        await waitForRender();

        expect(input.hasAttribute("readonly")).toBe(true);
        expect(input.readOnly).toBe(true);

        // 取消只读：应该移除 readonly 属性
        component.setReadonly(false);
        await waitForRender();

        expect(input.hasAttribute("readonly")).toBe(false);
        expect(input.readOnly).toBe(false);
    });

    test("应该移除 option 的 selected 属性当值变为 false", async () => {
        const shadowRoot = getShadowRoot(component);
        const option = queryElement<HTMLOptionElement>(shadowRoot, "#option");

        // 初始状态：未选中
        expect(option.hasAttribute("selected")).toBe(false);
        expect(option.selected).toBe(false);

        // 设置为选中
        component.setSelected(true);
        await waitForRender();

        expect(option.hasAttribute("selected")).toBe(true);
        expect(option.selected).toBe(true);

        // 取消选中：应该移除 selected 属性
        component.setSelected(false);
        await waitForRender();

        expect(option.hasAttribute("selected")).toBe(false);
        expect(option.selected).toBe(false);
    });

    test("应该正确处理布尔属性的多次切换", async () => {
        const shadowRoot = getShadowRoot(component);
        const radio = queryElement<HTMLInputElement>(shadowRoot, "#radio");

        // 多次切换 checked 状态
        const states = [true, false, true, false, true, false];
        for (const state of states) {
            component.setChecked(state);
            await waitForRender();

            expect(radio.hasAttribute("checked")).toBe(state);
            expect(radio.checked).toBe(state);
        }
    });

    test("应该同时处理多个布尔属性的变化", async () => {
        const shadowRoot = getShadowRoot(component);
        const input = queryElement<HTMLInputElement>(shadowRoot, "#text-input");

        // 同时设置多个布尔属性
        component.setDisabled(true);
        component.setReadonly(true);
        await waitForRender();

        expect(input.hasAttribute("disabled")).toBe(true);
        expect(input.hasAttribute("readonly")).toBe(true);

        // 同时移除多个布尔属性
        component.setDisabled(false);
        component.setReadonly(false);
        await waitForRender();

        expect(input.hasAttribute("disabled")).toBe(false);
        expect(input.hasAttribute("readonly")).toBe(false);
    });
});

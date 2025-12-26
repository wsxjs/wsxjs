import { WebComponent } from "../src/web-component";
import { state } from "../src/reactive-decorator";
import { h } from "../src/jsx-factory";

class RegressionList extends WebComponent {
    @state items = ["A", "B", "C"];

    render() {
        return h(
            "ul",
            {},
            ...this.items.map((item, index) => h("li", { id: `item-${index}` }, item))
        );
    }
}
customElements.define("regression-list", RegressionList);

class RegressionForm extends WebComponent {
    @state value = "";

    render() {
        return h(
            "div",
            {},
            h("input", {
                value: this.value,
                onInput: (e: any) => (this.value = e.target.value),
            }),
            h("span", { id: "display" }, this.value)
        );
    }
}
customElements.define("regression-form", RegressionForm);

describe("RFC 0037 Regression Suite", () => {
    // Helper to wait for re-renders (using generous timeout for stability)
    const waitForRender = () => new Promise<void>((resolve) => setTimeout(resolve, 100));

    test("List renders correctly and updates", async () => {
        const component = new RegressionList();
        document.body.appendChild(component);
        await waitForRender();

        const ul = component.shadowRoot!.querySelector("ul");
        expect(ul).not.toBeNull();
        expect(ul!.children.length).toBe(3);
        expect(ul!.children[0].textContent).toBe("A");

        component.items = ["A", "B", "C", "D"];
        (component as any).scheduleRerender();
        await waitForRender();

        const updatedUl = component.shadowRoot!.querySelector("ul");
        expect(updatedUl!.children.length).toBe(4);
        expect(updatedUl!.children[3].textContent).toBe("D");
    });

    test("Form updates value correctly", async () => {
        const component = new RegressionForm();
        document.body.appendChild(component);
        await waitForRender();

        const input = component.shadowRoot!.querySelector("input")!;

        // Output might vary if initial rendering happens differently, but we check after update
        // Simulate input
        input.value = "Hello";
        input.dispatchEvent(new Event("input"));

        (component as any).scheduleRerender();
        await waitForRender();

        const updatedDisplay = component.shadowRoot!.querySelector("#display");
        expect(updatedDisplay!.textContent).toBe("Hello");
    });
});

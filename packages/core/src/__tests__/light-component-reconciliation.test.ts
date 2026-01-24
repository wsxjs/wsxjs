import { LightComponent } from "../light-component";
// import { autoRegister } from "../index";
import { h } from "../jsx-factory";

// @autoRegister({ tagName: "test-light-reconcile" })
class TestLightReconcile extends LightComponent {
    private stage: number = 0;

    setStage(stage: number) {
        this.stage = stage;
        this.scheduleRerender();
    }

    render() {
        if (this.stage === 0) {
            return h("div", { class: "container" }, [
                h("div", { class: "cell" }, "Cell 1"),
                h("div", { class: "cell" }, "Cell 2"),
            ]);
        } else {
            // Shifted: new text node at start, then repurposed Divs
            return h("div", { class: "container" }, [
                "New Text",
                h("div", { class: "cell" }, "Cell 1"),
                h("div", { class: "cell" }, "Cell 2"),
            ]);
        }
    }
}

describe("LightComponent Reconciliation - Text Node Leakage", () => {
    // Manually register
    if (!customElements.get("test-light-reconcile")) {
        customElements.define("test-light-reconcile", TestLightReconcile);
    }
    let el: TestLightReconcile;

    beforeEach(() => {
        el = document.createElement("test-light-reconcile") as TestLightReconcile;
        document.body.appendChild(el);
    });

    afterEach(() => {
        document.body.removeChild(el);
    });

    test("should NOT leave orphaned text nodes when transitioning from Element to Text", async () => {
        // Initial render (stage 0)
        // Expected DOM: [Style, Div(.container [Div, Div])]

        // Use requestAnimationFrame to wait for initial render if needed,
        // but connectedCallback usually does it synchronously for LightComponent if no shadow.

        const container = el.querySelector(".container")!;
        expect(container.childNodes.length).toBe(2);
        expect(container.children.length).toBe(2);

        // Update to stage 1 (Shifted)
        el.setStage(1);

        // scheduleRerender is debounced, so we wait a bit or call it manually
        // For testing, we can often just wait for the next tick
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Expected DOM: [Style, Div(.container [Text("New Text"), Div, Div])]
        const updatedContainer = el.querySelector(".container")!;

        // CHECK: Total child nodes should be 3 (1 text + 2 divs)
        // If the bug exists, we might have extra nodes if reconciliation failed to clean up.
        expect(updatedContainer.childNodes.length).toBe(3);
        expect(updatedContainer.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
        expect(updatedContainer.childNodes[0].textContent).toBe("New Text");
        expect(updatedContainer.childNodes[1].textContent).toBe("Cell 1");
        expect(updatedContainer.childNodes[2].textContent).toBe("Cell 2");

        // CHECK: Ensure no text nodes are hanging at the bottom of the component itself
        // (LightComponent children are: [Style, Container, ...any leaked nodes])
        // Leaked nodes usually happen inside the container during updateChildren

        // Transition back to stage 0
        el.setStage(0);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const restoredContainer = el.querySelector(".container")!;
        expect(restoredContainer.childNodes.length).toBe(2);
        expect(restoredContainer.children.length).toBe(2);
        expect(restoredContainer.childNodes[0].nodeType).not.toBe(Node.TEXT_NODE);
    });
});

// @autoRegister({ tagName: "test-focus-stress" })
class TestFocusStress extends LightComponent {
    public value: string = "";
    public renderCount: number = 0;

    setValue(val: string) {
        this.value = val;
        this.scheduleRerender();
    }

    render() {
        this.renderCount++;
        return h("div", { class: "container" }, [
            h("h1", {}, "Focus Stress Test"),
            h("input", {
                type: "text",
                id: "test-input",
                value: this.value,
                onInput: (e: Event) => this.setValue((e.target as HTMLInputElement).value),
            }),
            h("div", { id: "count" }, `Rendered: ${this.renderCount}`),
        ]);
    }
}

describe("Focus Management Stress Test", () => {
    if (!customElements.get("test-focus-stress")) {
        customElements.define("test-focus-stress", TestFocusStress);
    }
    let el: TestFocusStress;

    beforeEach(() => {
        el = document.createElement("test-focus-stress") as TestFocusStress;
        document.body.appendChild(el);
    });

    afterEach(() => {
        document.body.removeChild(el);
    });

    test("should maintain focus and cursor position during rapid updates", async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const input = el.querySelector("input")! as HTMLInputElement;

        input.focus();
        expect(document.activeElement).toBe(input);

        // Type 'H'
        input.setSelectionRange(0, 0);
        input.value = "H";
        input.setSelectionRange(1, 1);
        el.setValue("H");

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(document.activeElement).toBe(input);
        expect(input.value).toBe("H");
        expect(input.selectionStart).toBe(1);

        // Type 'e' -> "He"
        input.value = "He";
        input.setSelectionRange(2, 2);
        el.setValue("He");

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(document.activeElement).toBe(input);
        expect(input.value).toBe("He");
        expect(input.selectionStart).toBe(2);
    });

    test("should verify that the node is reused", async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const inputBefore = el.querySelector("input")! as HTMLInputElement;

        el.setValue("Updated");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const inputAfter = el.querySelector("input")! as HTMLInputElement;
        expect(inputAfter).toBe(inputBefore);
    });
});

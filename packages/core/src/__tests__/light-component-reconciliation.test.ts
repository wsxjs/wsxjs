import { LightComponent } from "../light-component";
import { autoRegister } from "../index";
import { h } from "../jsx-factory";

@autoRegister({ tagName: "test-light-reconcile" })
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

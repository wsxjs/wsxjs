import { LightComponent } from "../light-component";
import { autoRegister } from "../index";
import { h } from "../jsx-factory";

// Define a component that updates on every input
@autoRegister({ tagName: "test-focus-stress" })
class TestFocusComponent extends LightComponent {
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
                "data-wsx-key": "input-1", // Key is crucial for current focus logic
                onInput: (e: any) => this.setValue(e.target.value),
            }),
            h("div", { id: "count" }, `Rendered: ${this.renderCount}`),
        ]);
    }
}

describe("Focus Management Stress Test", () => {
    let el: TestFocusComponent;

    beforeEach(() => {
        el = document.createElement("test-focus-stress") as TestFocusComponent;
        document.body.appendChild(el);
    });

    afterEach(() => {
        document.body.removeChild(el);
    });

    test("should maintain focus and cursor position during rapid updates", async () => {
        // Initial render
        await new Promise((resolve) => setTimeout(resolve, 50));

        const input = el.querySelector("input") as HTMLInputElement;
        expect(input).toBeDefined();

        // Focus the input
        input.focus();
        expect(document.activeElement).toBe(input);

        // Simulate typing "Hello"
        // Steps:
        // 1. Set cursor
        // 2. Update value
        // 3. Dispatch input event (which triggers rerender)
        // 4. Wait for rerender
        // 5. Check focus and cursor

        // Type 'H'
        input.setSelectionRange(0, 0); // Start
        input.value = "H";
        input.setSelectionRange(1, 1); // Cursor moves after 'H'
        el.setValue("H"); // Trigger rerender manually to simulate state update

        await new Promise((resolve) => setTimeout(resolve, 50));

        // Verify Focus
        expect(document.activeElement).toBe(input);

        // Verify Value
        expect(input.value).toBe("H");

        // Verify Cursor (This is the hardest part for JSDOM/Reconciliation)
        // If the node was replaced, cursor is likely lost (reset to 0 or end depending on browser)
        // If the node was reused, cursor should persist if logic handles it.
        expect(input.selectionStart).toBe(1);
        expect(input.selectionEnd).toBe(1);

        // Type 'e' -> "He"
        input.value = "He";
        input.setSelectionRange(2, 2);
        el.setValue("He");

        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(document.activeElement).toBe(input);
        expect(input.value).toBe("He");
        expect(input.selectionStart).toBe(2);
    });

    test("should verify that the node is reused (sanity check for reconciliation)", async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const inputBefore = el.querySelector("input") as HTMLInputElement;

        // Update
        el.setValue("Updated");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const inputAfter = el.querySelector("input") as HTMLInputElement;

        // CRITICAL: The node reference must be the same for natural focus preservation
        expect(inputAfter).toBe(inputBefore);
    });
});

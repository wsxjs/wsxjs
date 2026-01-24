import { LightComponent } from "../light-component";
import { WebComponent } from "../web-component";
import { h } from "../jsx-factory";

// --- Light Component for Testing ---
class TestLightFocus extends LightComponent {
    public value: string = "";

    setValue(val: string) {
        this.value = val;
        this.scheduleRerender();
    }

    render() {
        return h("div", {}, [
            h("input", {
                id: "light-input",
                type: "text",
                value: this.value,
                onInput: (e: Event) => this.setValue((e.target as HTMLInputElement).value),
            }),
        ]);
    }
}

if (!customElements.get("test-light-focus")) {
    customElements.define("test-light-focus", TestLightFocus);
}

// --- Web Component (Shadow DOM) for Testing ---
class TestWebFocus extends WebComponent {
    public value: string = "";
    public textAreaValue: string = "";
    public selectValue: string = "A";

    setValue(val: string) {
        this.value = val;
        this.scheduleRerender();
    }

    setTextAreaValue(val: string) {
        this.textAreaValue = val;
        this.scheduleRerender();
    }

    setSelectValue(val: string) {
        this.selectValue = val;
        this.scheduleRerender();
    }

    render() {
        return h("div", {}, [
            h("input", {
                id: "shadow-input",
                type: "text",
                value: this.value,
                onInput: (e: Event) => this.setValue((e.target as HTMLInputElement).value),
            }),
            h("textarea", {
                id: "shadow-textarea",
                value: this.textAreaValue,
                onInput: (e: Event) =>
                    this.setTextAreaValue((e.target as HTMLTextAreaElement).value),
            }),
            h(
                "select",
                {
                    id: "shadow-select",
                    value: this.selectValue,
                    onChange: (e: Event) =>
                        this.setSelectValue((e.target as HTMLSelectElement).value),
                },
                [h("option", { value: "A" }, "Option A"), h("option", { value: "B" }, "Option B")]
            ),
        ]);
    }
}

if (!customElements.get("test-web-focus")) {
    customElements.define("test-web-focus", TestWebFocus);
}

describe("Focus Preservation & Real-time Updates", () => {
    describe("LightComponent", () => {
        let el: TestLightFocus;

        beforeEach(() => {
            el = document.createElement("test-light-focus") as TestLightFocus;
            document.body.appendChild(el);
        });

        afterEach(() => {
            document.body.removeChild(el);
        });

        test("should preserve focus and cursor at END of input during updates", async () => {
            // Wait for initial render
            await new Promise((r) => setTimeout(r, 20));
            const input = el.querySelector("#light-input") as HTMLInputElement;

            input.focus();
            input.value = "H";
            input.setSelectionRange(1, 1);
            el.setValue("H");

            await new Promise((r) => setTimeout(r, 20));

            expect(document.activeElement).toBe(input);
            expect(input.value).toBe("H");
            expect(input.selectionStart).toBe(1);

            input.value = "He";
            input.setSelectionRange(2, 2);
            el.setValue("He");

            await new Promise((r) => setTimeout(r, 20));

            expect(document.activeElement).toBe(input);
            expect(input.value).toBe("He");
            expect(input.selectionStart).toBe(2);
        });

        test("should preserve focus and cursor in MIDDLE of input during updates", async () => {
            el.setValue("Hello");
            await new Promise((r) => setTimeout(r, 20));

            const input = el.querySelector("#light-input") as HTMLInputElement;
            input.focus();

            // Move cursor to "Hel|lo" (index 3)
            input.setSelectionRange(3, 3);

            // Insert 'p': "Helplo"
            input.value = "Helplo";
            input.setSelectionRange(4, 4);
            el.setValue("Helplo");

            await new Promise((r) => setTimeout(r, 20));

            expect(document.activeElement).toBe(input);
            expect(input.value).toBe("Helplo");
            expect(input.selectionStart).toBe(4);
        });
    });

    describe("WebComponent (Shadow DOM)", () => {
        let el: TestWebFocus;

        beforeEach(() => {
            el = document.createElement("test-web-focus") as TestWebFocus;
            document.body.appendChild(el);
        });

        afterEach(() => {
            document.body.removeChild(el);
        });

        test("should preserve focus in Shadow DOM input", async () => {
            await new Promise((r) => setTimeout(r, 20));
            const shadowRoot = el.shadowRoot!;
            const input = shadowRoot.getElementById("shadow-input") as HTMLInputElement;

            input.focus();
            expect(shadowRoot.activeElement).toBe(input);

            input.value = "A";
            input.setSelectionRange(1, 1);
            el.setValue("A");

            await new Promise((r) => setTimeout(r, 20));

            expect(shadowRoot.activeElement).toBe(input);
            expect(input.value).toBe("A");
        });

        test("should preserve focus in Textarea", async () => {
            await new Promise((r) => setTimeout(r, 20));
            const shadowRoot = el.shadowRoot!;
            const textarea = shadowRoot.getElementById("shadow-textarea") as HTMLTextAreaElement;

            textarea.focus();
            textarea.value = "Line 1";
            el.setTextAreaValue("Line 1");

            await new Promise((r) => setTimeout(r, 20));

            expect(shadowRoot.activeElement).toBe(textarea);
            expect(textarea.value).toBe("Line 1");
        });

        test("should preserve focus in Select", async () => {
            await new Promise((r) => setTimeout(r, 20));
            const shadowRoot = el.shadowRoot!;
            const select = shadowRoot.getElementById("shadow-select") as HTMLSelectElement;

            select.focus();
            // Simulate changing value
            select.value = "B";
            // User change implies dispatching change event usually, but here we invoke handler directly
            el.setSelectValue("B");

            await new Promise((r) => setTimeout(r, 20));

            expect(shadowRoot.activeElement).toBe(select);
            expect(select.value).toBe("B");
        });
    });
});

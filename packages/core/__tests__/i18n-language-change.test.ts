/**
 * Test for language change issue after DOM optimization refactor
 *
 * This test verifies that text content updates correctly when language changes,
 * even when DOM elements are cached and reused.
 */

import { h } from "../src/jsx-factory";
import { WebComponent, state } from "../src/web-component";
import { RenderContext } from "../src/render-context";

// Mock i18n instance
const mockI18n = {
    language: "en",
    t: (key: string) => {
        const translations: Record<string, Record<string, string>> = {
            en: {
                welcome: "Welcome",
                hello: "Hello",
            },
            zh: {
                welcome: "欢迎",
                hello: "你好",
            },
        };
        return translations[mockI18n.language]?.[key] || key;
    },
    changeLanguage: jest.fn((lang: string) => {
        mockI18n.language = lang;
        return Promise.resolve();
    }),
    on: jest.fn(),
    off: jest.fn(),
};

class I18nTestComponent extends WebComponent {
    @state private lang: string = "en";

    render() {
        // Simulate i18n.t() call
        const text = mockI18n.t("welcome");
        return h("div", { __testId: "container" }, h("span", { __testId: "text" }, text));
    }

    changeLanguage(lang: string) {
        this.lang = lang;
        mockI18n.language = lang;
        this.rerender();
    }
}

customElements.define("i18n-test-component", I18nTestComponent);

describe("i18n Language Change with DOM Caching", () => {
    let component: I18nTestComponent;

    beforeEach(() => {
        document.body.innerHTML = "";
        component = new I18nTestComponent();
        document.body.appendChild(component);
        mockI18n.language = "en";
    });

    afterEach(() => {
        component.remove();
        component._domCache.clear();
    });

    test("Text content should update when language changes", () => {
        // 1. Initial render (English)
        let render1: HTMLElement;
        RenderContext.runInContext(component, () => {
            render1 = component.render() as HTMLElement;
        });

        const span1 = render1!.querySelector("span") as HTMLElement;
        expect(span1.textContent).toBe("Welcome");

        // 2. Change language to Chinese
        component.changeLanguage("zh");

        let render2: HTMLElement;
        RenderContext.runInContext(component, () => {
            render2 = component.render() as HTMLElement;
        });

        // Verify element is reused (cached)
        const span2 = render2!.querySelector("span") as HTMLElement;
        expect(span2).toBe(span1); // Same element reference

        // Verify text content is updated
        expect(span2.textContent).toBe("欢迎"); // Chinese translation
    });

    test("Text content should update correctly in nested elements", () => {
        component.render = () => {
            const text = mockI18n.t("welcome");
            return h(
                "div",
                { __testId: "container" },
                h("div", { __testId: "inner" }, h("span", { __testId: "text" }, text))
            );
        };

        // 1. Initial render (English)
        let render1: HTMLElement;
        RenderContext.runInContext(component, () => {
            render1 = component.render() as HTMLElement;
        });

        const span1 = render1!.querySelector("span") as HTMLElement;
        expect(span1.textContent).toBe("Welcome");

        // 2. Change language to Chinese
        component.changeLanguage("zh");

        let render2: HTMLElement;
        RenderContext.runInContext(component, () => {
            render2 = component.render() as HTMLElement;
        });

        // Verify text content is updated
        const span2 = render2!.querySelector("span") as HTMLElement;
        expect(span2.textContent).toBe("欢迎"); // Chinese translation
    });

    test("Multiple text nodes should update correctly", () => {
        component.render = () => {
            const text1 = mockI18n.t("welcome");
            const text2 = mockI18n.t("hello");
            return h(
                "div",
                { __testId: "container" },
                h("span", { __testId: "text1" }, text1),
                h("span", { __testId: "text2" }, text2)
            );
        };

        // 1. Initial render (English)
        let render1: HTMLElement;
        RenderContext.runInContext(component, () => {
            render1 = component.render() as HTMLElement;
        });

        const spans = render1!.querySelectorAll("span");
        expect(spans[0].textContent).toBe("Welcome");
        expect(spans[1].textContent).toBe("Hello");

        // 2. Change language to Chinese
        component.changeLanguage("zh");

        let render2: HTMLElement;
        RenderContext.runInContext(component, () => {
            render2 = component.render() as HTMLElement;
        });

        // Verify text content is updated
        const spans2 = render2!.querySelectorAll("span");
        expect(spans2[0].textContent).toBe("欢迎");
        expect(spans2[1].textContent).toBe("你好");
    });
});

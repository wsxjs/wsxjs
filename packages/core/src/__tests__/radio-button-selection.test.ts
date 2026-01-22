/**
 * Radio Button Selection Test
 *
 * 测试单选按钮的选择行为，重现 QuizQuestion 组件中的问题
 */

import { LightComponent } from "../light-component";
import { h } from "../jsx-factory";

// Mock loggers
jest.mock("@wsxjs/wsx-logger", () => ({
    createLogger: () => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        trace: jest.fn(),
    }),
}));

// 简化的 QuizQuestion 组件用于测试
class TestRadioComponent extends LightComponent {
    private selectedValue: string | null = null;

    render() {
        const options = [
            { id: "opt1", text: "restaraunt" },
            { id: "opt2", text: "restaurant" },
            { id: "opt3", text: "restaraunt" },
            { id: "opt4", text: "restarant" },
        ];

        return h("div", { class: "quiz-question" }, [
            h("h3", {}, "Which is correct?"),
            h(
                "div",
                { class: "quiz-question-options" },
                options.map((option) => {
                    const isSelected = this.selectedValue === option.id;
                    return h(
                        "label",
                        {
                            key: option.id,
                            class: `quiz-question-option ${isSelected ? "selected" : ""}`,
                        },
                        [
                            h("input", {
                                type: "radio",
                                name: "test-question",
                                value: option.id,
                                checked: isSelected,
                                onChange: () => {
                                    this.selectedValue = option.id;
                                    this.scheduleRerender();
                                },
                            }),
                            h("span", { class: "quiz-question-option-text" }, option.text),
                        ]
                    );
                })
            ),
        ]);
    }
}

// 注册组件
if (!customElements.get("test-radio-component")) {
    customElements.define("test-radio-component", TestRadioComponent);
}

describe("Radio Button Selection (QuizQuestion Issue)", () => {
    let component: TestRadioComponent;
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        component = document.createElement("test-radio-component") as TestRadioComponent;
        container.appendChild(component);
    });

    afterEach(() => {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    });

    test("should render all radio options", () => {
        const inputs = component.querySelectorAll('input[type="radio"]');
        expect(inputs.length).toBe(4);
    });

    test("should have same name attribute for all radio buttons", () => {
        const inputs = component.querySelectorAll('input[type="radio"]');
        inputs.forEach((input) => {
            expect((input as HTMLInputElement).name).toBe("test-question");
        });
    });

    test("should only have one radio button checked at a time", async () => {
        // 获取所有 radio inputs
        const inputs = component.querySelectorAll(
            'input[type="radio"]'
        ) as NodeListOf<HTMLInputElement>;

        // 点击第二个选项
        const secondInput = inputs[1];
        secondInput.click();

        // 等待重渲染
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 检查只有一个被选中
        const checkedInputs = Array.from(inputs).filter((input) => input.checked);
        expect(checkedInputs.length).toBe(1);
        expect(checkedInputs[0]).toBe(secondInput);
    });

    test("should update selected class correctly", async () => {
        const labels = component.querySelectorAll("label.quiz-question-option");
        const inputs = component.querySelectorAll(
            'input[type="radio"]'
        ) as NodeListOf<HTMLInputElement>;

        // 点击第二个选项
        inputs[1].click();
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 检查只有第二个 label 有 selected class
        const selectedLabels = Array.from(labels).filter((label) =>
            label.classList.contains("selected")
        );

        expect(selectedLabels.length).toBe(1);
        expect(selectedLabels[0]).toBe(labels[1]);
    });

    test("should switch selection when clicking different option", async () => {
        const inputs = component.querySelectorAll(
            'input[type="radio"]'
        ) as NodeListOf<HTMLInputElement>;

        // 先选择第一个
        inputs[0].click();
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(inputs[0].checked).toBe(true);
        expect(inputs[1].checked).toBe(false);

        // 再选择第二个
        inputs[1].click();
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 第一个应该被取消选中
        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
    });
});

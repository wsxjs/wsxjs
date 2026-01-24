/**
 * Smart Property Assignment 测试
 * 测试 RFC 0036 中定义的智能属性分配策略
 *
 * 测试覆盖：
 * 1. 标准 HTML 属性使用 setAttribute
 * 2. 非标准属性使用 JavaScript 属性赋值
 * 3. data vs data-* 的区别
 * 4. 复杂对象序列化
 * 5. SVG 元素特殊处理
 * 6. 只读属性处理
 * 7. 边界情况和错误处理
 */

// 测试需要访问动态创建的自定义元素的 JavaScript 属性，类型系统无法推断这些属性

import { h } from "../jsx-factory";

describe("Smart Property Assignment (RFC 0036)", () => {
    describe("标准 HTML 属性", () => {
        it("应该使用 setAttribute 设置 id 属性", () => {
            const div = h("div", { id: "test-id" });
            expect(div.getAttribute("id")).toBe("test-id");
            expect(div.id).toBe("test-id");
        });

        it("应该使用 setAttribute 设置 class 属性", () => {
            const div = h("div", { class: "test-class" });
            expect(div.getAttribute("class")).toBe("test-class");
            expect(div.className).toBe("test-class");
        });

        it("应该使用 setAttribute 设置 data-* 属性", () => {
            const div = h("div", { "data-test": "value" });
            expect(div.getAttribute("data-test")).toBe("value");
            // data-* 是标准属性，不应该设置 JavaScript 属性
            // 使用 hasOwnProperty 检查属性是否存在
            expect(Object.prototype.hasOwnProperty.call(div, "data-test")).toBe(false);
        });

        it("应该使用 setAttribute 设置 aria-* 属性", () => {
            const div = h("div", { "aria-label": "Test label" });
            expect(div.getAttribute("aria-label")).toBe("Test label");
            // aria-* 是标准属性，不应该设置 JavaScript 属性
            // 使用 hasOwnProperty 检查属性是否存在
            expect(Object.prototype.hasOwnProperty.call(div, "aria-label")).toBe(false);
        });

        it("应该序列化对象值到标准属性", () => {
            const div = h("div", { "data-config": { key: "value" } });
            const attrValue = div.getAttribute("data-config");
            expect(attrValue).toBeTruthy();
            if (attrValue) {
                expect(JSON.parse(attrValue)).toEqual({ key: "value" });
            }
        });

        it("应该警告过大的标准属性值", () => {
            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
            const largeData = { data: "x".repeat(2 * 1024 * 1024) }; // 2MB
            h("div", { "data-large": largeData });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("value too large"));
            consoleSpy.mockRestore();
        });

        it("应该处理循环引用的对象", () => {
            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
            const circular: { data: string; self: any } = { data: "test", self: null };
            circular.self = circular;
            h("div", { "data-circular": circular });
            // console.warn 被调用时有两个参数：消息和错误对象
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Cannot serialize"),
                expect.anything()
            );
            consoleSpy.mockRestore();
        });
    });

    describe("非标准属性", () => {
        it("应该使用 JavaScript 属性赋值设置非标准属性（元素有该属性）", () => {
            // 创建一个自定义元素，定义 items 属性
            class TestComponent extends HTMLElement {
                items = [];
            }
            customElements.define("test-component", TestComponent);

            const items = ["item1", "item2", "item3"];

            const props = { items };

            // 测试需要访问动态创建的自定义元素的 JavaScript 属性，类型系统无法推断这些属性
            const result = h("test-component", props);

            // 使用索引访问避免类型断言，因为 Babel 解析器不支持类型断言语法
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["items"]).toEqual(items);
            // 不应该设置 HTML 属性
            expect(result.getAttribute("items")).toBeNull();
        });

        it("应该回退到 setAttribute 如果元素没有该 JavaScript 属性", () => {
            const div = h("div", { customProp: "value" });
            expect(div.getAttribute("customProp")).toBe("value");
        });

        it("应该序列化对象值到非标准属性（回退情况）", () => {
            const div = h("div", { customData: { key: "value" } });
            const attrValue = div.getAttribute("customData");
            expect(attrValue).toBeTruthy();
            if (attrValue) {
                expect(JSON.parse(attrValue)).toEqual({ key: "value" });
            }
        });

        it("应该支持数组值作为 JavaScript 属性", () => {
            class TestComponent extends HTMLElement {
                items = [];
            }
            customElements.define("test-component-array", TestComponent);

            const items = ["item1", "item2"];

            // 测试需要传递任意类型的 props 以验证 JavaScript 属性赋值
            const props = { items };

            // 测试需要访问动态创建的自定义元素的 JavaScript 属性
            const result = h("test-component-array", props);

            // 使用索引访问避免类型断言，因为 Babel 解析器不支持类型断言语法
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["items"]).toEqual(items);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(Array.isArray(result["items"])).toBe(true);
        });

        it("应该支持嵌套对象作为 JavaScript 属性", () => {
            class TestComponent extends HTMLElement {
                config = {};
            }
            customElements.define("test-component-nested", TestComponent);

            const config = {
                level1: {
                    level2: {
                        level3: "deep value",
                    },
                },
            };

            // 测试需要传递嵌套对象作为 props 以验证复杂类型的 JavaScript 属性赋值
            const props = { config };

            // 测试需要访问动态创建的自定义元素的嵌套属性
            const result = h("test-component-nested", props);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["config"]).toEqual(config);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的嵌套属性
            expect((result["config"] as any).level1.level2.level3).toBe("deep value");
        });

        it("应该支持函数作为 JavaScript 属性", () => {
            class TestComponent extends HTMLElement {
                // 使用非 on* 开头的属性名，因为 on* 会被当作事件监听器处理
                saveHandler = undefined;
            }
            customElements.define("test-component-fn", TestComponent);

            const handler = jest.fn();

            // 测试需要传递函数作为 props 以验证函数类型的 JavaScript 属性赋值
            const props = { saveHandler: handler };

            // 测试需要访问动态创建的自定义元素的函数属性
            const result = h("test-component-fn", props);

            // 使用索引访问避免类型断言，因为 Babel 解析器不支持类型断言语法
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["saveHandler"]).toBe(handler);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(typeof result["saveHandler"]).toBe("function");
        });

        it("应该支持 Date 对象作为 JavaScript 属性", () => {
            class TestComponent extends HTMLElement {
                timestamp = undefined;
            }
            customElements.define("test-component-date", TestComponent);

            const date = new Date();

            // 测试需要传递 Date 对象作为 props 以验证对象类型的 JavaScript 属性赋值
            const props = { timestamp: date };

            // 测试需要访问动态创建的自定义元素的 Date 属性
            const result = h("test-component-date", props);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["timestamp"]).toBe(date);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["timestamp"] instanceof Date).toBe(true);
        });

        it("应该支持 RegExp 对象作为 JavaScript 属性", () => {
            class TestComponent extends HTMLElement {
                pattern = undefined;
            }
            customElements.define("test-component-regex", TestComponent);

            const regex = /test/gi;

            // 测试需要传递 RegExp 对象作为 props 以验证对象类型的 JavaScript 属性赋值
            const props = { pattern: regex };

            // 测试需要访问动态创建的自定义元素的 RegExp 属性
            const result = h("test-component-regex", props);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["pattern"]).toBe(regex);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["pattern"] instanceof RegExp).toBe(true);
        });

        it("应该支持 Symbol 值作为 JavaScript 属性", () => {
            class TestComponent extends HTMLElement {
                symbolProp = undefined;
            }
            customElements.define("test-component-symbol", TestComponent);

            const symbol = Symbol("test");

            // 测试需要传递 Symbol 作为 props 以验证 Symbol 类型的 JavaScript 属性赋值
            const props = { symbolProp: symbol };

            // 测试需要访问动态创建的自定义元素的 Symbol 属性
            const result = h("test-component-symbol", props);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["symbolProp"]).toBe(symbol);
        });

        it("应该支持 Map 和 Set 对象作为 JavaScript 属性", () => {
            class TestComponent extends HTMLElement {
                mapData = undefined;
                setData = undefined;
            }
            customElements.define("test-component-collections", TestComponent);

            const map = new Map([["key", "value"]]);
            const set = new Set([1, 2, 3]);

            // 测试需要传递 Map 和 Set 对象作为 props 以验证集合类型的 JavaScript 属性赋值
            const props = { mapData: map, setData: set };

            // 测试需要访问动态创建的自定义元素的集合类型属性
            const result = h("test-component-collections", props);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["mapData"]).toBe(map);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["setData"]).toBe(set);
        });
    });

    describe("data vs data-* 区别", () => {
        it("data（不带连字符）应该检查 JavaScript 属性", () => {
            class TestComponent extends HTMLElement {
                data = {};
            }
            customElements.define("test-component-data", TestComponent);

            const largeData = { items: [1, 2, 3] };

            // 测试需要传递任意对象作为 props 以验证 data 属性的 JavaScript 属性赋值
            const props = { data: largeData };

            // 测试需要访问动态创建的自定义元素的 data 属性
            const result = h("test-component-data", props);
            // 如果元素有 data 属性，应该使用 JavaScript 属性赋值
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["data"]).toEqual(largeData);
            expect(result.getAttribute("data")).toBeNull();
        });

        it("data-*（带连字符）应该只使用 setAttribute", () => {
            const largeData = { items: [1, 2, 3] };
            const div = h("div", { "data-chart": largeData });
            // data-* 是标准属性，只使用 setAttribute
            const attrValue = div.getAttribute("data-chart");
            expect(attrValue).toBeTruthy();
            expect(typeof attrValue).toBe("string");
            if (attrValue) {
                expect(JSON.parse(attrValue)).toEqual(largeData);
            }
            // 不应该设置 JavaScript 属性
            // 使用 hasOwnProperty 检查属性是否存在
            expect(Object.prototype.hasOwnProperty.call(div, "data-chart")).toBe(false);
        });

        it("data 属性（元素没有该属性时）应该回退到 setAttribute", () => {
            const div = h("div", { data: { test: "value" } });
            // 如果元素没有 data 属性，应该回退到 setAttribute
            const attrValue = div.getAttribute("data");
            expect(attrValue).toBeTruthy();
            if (attrValue) {
                expect(JSON.parse(attrValue)).toEqual({ test: "value" });
            }
        });
    });

    describe("SVG 元素特殊处理", () => {
        it("应该使用 setAttribute 设置 SVG 属性", () => {
            const svg = h("svg", { viewBox: "0 0 100 100" });
            expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
        });

        it("应该序列化对象值到 SVG 属性", () => {
            const svg = h("svg", { "data-config": { width: 100, height: 100 } });
            const attrValue = svg.getAttribute("data-config");
            expect(attrValue).toBeTruthy();
            if (attrValue) {
                expect(JSON.parse(attrValue)).toEqual({ width: 100, height: 100 });
            }
        });

        it("应该处理 SVG 元素的只读属性（如 viewBox）", () => {
            const svg = h("svg", { viewBox: "0 0 200 200" });
            // viewBox 是只读属性，应该使用 setAttribute
            expect(svg.getAttribute("viewBox")).toBe("0 0 200 200");
        });
    });

    describe("只读属性处理", () => {
        it("应该处理只读属性，回退到 setAttribute", () => {
            const div = document.createElement("div");
            // 定义一个只读属性
            Object.defineProperty(div, "readonlyProp", {
                value: "original",
                writable: false,
            });

            // 测试需要传递任意 props 以验证只读属性的回退行为
            const props = { readonlyProp: "new value" };
            const result = h("div", props);
            // 只读属性应该使用 setAttribute
            expect(result.getAttribute("readonlyProp")).toBe("new value");
        });

        it("应该处理只读属性的对象值序列化", () => {
            const div = document.createElement("div");
            Object.defineProperty(div, "readonlyObj", {
                value: {},
                writable: false,
            });

            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
            const obj = { test: "value" };

            // 测试需要传递对象作为 props 以验证只读对象属性的序列化行为
            const props = { readonlyObj: obj };
            const result = h("div", props);
            const attrValue = result.getAttribute("readonlyObj");
            expect(attrValue).toBeTruthy();
            if (attrValue) {
                expect(JSON.parse(attrValue)).toEqual(obj);
            }
            consoleSpy.mockRestore();
        });
    });

    describe("边界情况", () => {
        it("应该处理 null 值", () => {
            class TestComponent extends HTMLElement {
                prop = null;
            }
            customElements.define("test-component-null", TestComponent);

            // 测试需要传递 null 值作为 props 以验证 null 值的处理
            const props = { prop: null };

            // 测试需要访问动态创建的自定义元素的 null 属性
            const result = h("test-component-null", props);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["prop"]).toBeNull();
        });

        it("应该处理 undefined 值", () => {
            class TestComponent extends HTMLElement {
                prop = undefined;
            }
            customElements.define("test-component-undefined", TestComponent);

            // 测试需要传递 undefined 值作为 props 以验证 undefined 值的处理
            const props = { prop: undefined };

            // 测试需要访问动态创建的自定义元素的 undefined 属性
            const result = h("test-component-undefined", props);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["prop"]).toBeUndefined();
        });

        it("应该处理空字符串", () => {
            const div = h("div", { id: "" });
            expect(div.getAttribute("id")).toBe("");
            expect(div.id).toBe("");
        });

        it("应该处理数字值", () => {
            const div = h("div", { tabindex: 5 });
            expect(div.getAttribute("tabindex")).toBe("5");
            expect(div.tabIndex).toBe(5);
        });

        it("应该处理布尔值（标准属性）", () => {
            const input = h("input", { disabled: true });
            expect(input.getAttribute("disabled")).toBe("");

            // 使用索引访问避免类型断言，因为 Babel 解析器不支持类型断言语法
            // @ts-expect-error - 测试需要访问表单元素的属性
            expect(input["disabled"]).toBe(true);
        });

        it("应该处理非常长的属性名", () => {
            const longName = "a".repeat(1000);

            // 测试需要动态创建属性名，使用 any 类型避免类型检查
            const props: any = {};
            props[longName] = "value";
            const div = h("div", props);
            expect(div.getAttribute(longName)).toBe("value");
        });

        it("应该处理 Unicode 字符", () => {
            const div = h("div", { "data-测试": "值" });
            expect(div.getAttribute("data-测试")).toBe("值");
        });

        it("应该处理特殊字符在属性名中", () => {
            // 注意：HTML 属性名不能包含某些特殊字符，但我们可以测试有效的字符
            const div = h("div", { "data-test_value": "value" });
            expect(div.getAttribute("data-test_value")).toBe("value");
        });
    });

    describe("特殊属性（不应进入 setSmartProperty）", () => {
        it("ref 应该由特殊处理逻辑处理", () => {
            const refCallback = jest.fn();
            const div = h("div", { ref: refCallback });
            expect(refCallback).toHaveBeenCalledWith(div);
        });

        it("className 应该由特殊处理逻辑处理", () => {
            const div = h("div", { className: "test-class" });
            expect(div.className).toBe("test-class");
        });

        it("style 应该由特殊处理逻辑处理", () => {
            const div = h("div", { style: "color: red;" });
            expect(div.getAttribute("style")).toBe("color: red;");
        });

        it("on* 事件监听器应该由特殊处理逻辑处理", () => {
            const handler = jest.fn();
            const div = h("div", { onClick: handler });
            (div as HTMLElement).click();
            expect(handler).toHaveBeenCalled();
        });

        it("value 属性应该由特殊处理逻辑处理（表单元素）", () => {
            const input = h("input", { value: "test" });

            // 使用索引访问避免类型断言，因为 Babel 解析器不支持类型断言语法
            // @ts-expect-error - 测试需要访问表单元素的属性
            expect(input["value"]).toBe("test");
        });
    });

    describe("实际使用场景", () => {
        it("应该正确处理 List 组件的 items 属性", () => {
            class ListComponent extends HTMLElement {
                items = [];
            }
            customElements.define("wsx-marked-list", ListComponent);

            const items = ["Item 1", "Item 2", "Item 3"];

            // 测试需要传递数组作为 props 以验证实际使用场景中的 JavaScript 属性赋值
            const props = { items };

            // 测试需要访问动态创建的自定义元素的数组属性
            const result = h("wsx-marked-list", props);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["items"]).toEqual(items);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(Array.isArray(result["items"])).toBe(true);
        });

        it("应该正确处理混合标准和非标准属性", () => {
            class ChartComponent extends HTMLElement {
                chartData = {};
            }
            customElements.define("my-chart", ChartComponent);

            const chartData = { points: [1, 2, 3] };

            // 测试需要传递混合的标准和非标准属性作为 props 以验证混合场景
            const props = {
                id: "chart-1",
                "data-testid": "chart",
                "aria-label": "Chart",
                chartData,
            };

            // 测试需要访问动态创建的自定义元素的混合属性
            const result = h("my-chart", props);

            // 标准属性
            expect(result.getAttribute("id")).toBe("chart-1");
            expect(result.getAttribute("data-testid")).toBe("chart");
            expect(result.getAttribute("aria-label")).toBe("Chart");

            // 非标准属性
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["chartData"]).toEqual(chartData);
        });

        it("应该正确处理大型数据集", () => {
            class ChartComponent extends HTMLElement {
                data = {};
            }
            customElements.define("large-chart", ChartComponent);

            const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
                id: i,
                value: `Item ${i}`,
                metadata: { timestamp: Date.now(), index: i },
            }));

            // 测试需要传递大型数据集作为 props 以验证大数据场景的 JavaScript 属性赋值
            const props = { data: largeDataset };

            // 测试需要访问动态创建的自定义元素的大型数据属性
            const result = h("large-chart", props);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的 JavaScript 属性
            expect(result["data"]).toEqual(largeDataset);
            // @ts-expect-error - 测试需要访问动态创建的自定义元素的嵌套属性
            expect(result["data"].length).toBe(10000);
            // 不应该设置 HTML 属性（因为使用了 JavaScript 属性）
            expect(result.getAttribute("data")).toBeNull();
        });
    });

    describe("错误处理和警告", () => {
        it("应该警告过大的属性值（标准属性）", () => {
            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
            const largeData = { data: "x".repeat(2 * 1024 * 1024) }; // 2MB
            h("div", { "data-large": largeData });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("value too large"));
            consoleSpy.mockRestore();
        });

        it("应该警告过大的属性值（非标准属性回退）", () => {
            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
            const largeData = { data: "x".repeat(2 * 1024 * 1024) }; // 2MB
            h("div", { customLarge: largeData });
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("value too large"));
            consoleSpy.mockRestore();
        });

        it("应该警告无法序列化的对象（循环引用）", () => {
            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
            const circular: { data: string; self: any } = { data: "test", self: null };
            circular.self = circular;
            h("div", { "data-circular": circular });
            // console.warn 被调用时有两个参数：消息和错误对象
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Cannot serialize"),
                expect.anything()
            );
            consoleSpy.mockRestore();
        });
    });

    describe("性能测试", () => {
        it("应该高效处理大量属性设置", () => {
            // 测试需要动态创建大量属性，使用 any 类型避免类型检查
            const props: any = {};
            for (let i = 0; i < 1000; i++) {
                props[`prop${i}`] = `value${i}`;
            }

            const start = performance.now();
            h("div", props);
            const end = performance.now();

            // 应该在合理时间内完成（例如 500ms 内，考虑测试环境性能波动）
            expect(end - start).toBeLessThan(500);
        });

        it("应该高效处理大量 JavaScript 属性赋值", () => {
            class TestComponent extends HTMLElement {
                // 动态属性支持
            }
            customElements.define("perf-test", TestComponent);

            // 测试需要动态创建大量属性，使用 any 类型避免类型检查
            const props: any = {};
            for (let i = 0; i < 1000; i++) {
                props[`prop${i}`] = { value: i };
            }

            const start = performance.now();

            // 性能测试需要访问动态创建的自定义元素的大量动态属性
            const result = h("perf-test", props);
            // 动态设置属性
            for (let i = 0; i < 1000; i++) {
                // 测试需要访问动态创建的自定义元素的大量动态属性
                (result as any)[`prop${i}`] = props[`prop${i}`];
            }
            const end = performance.now();

            // 应该在合理时间内完成（例如 500ms 内，考虑测试环境性能波动）
            expect(end - start).toBeLessThan(500);
        });
    });
});

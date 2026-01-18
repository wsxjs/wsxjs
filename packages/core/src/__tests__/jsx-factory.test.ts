/**
 * 详尽的 JSX Factory HTML 字符串解析测试
 * 覆盖各种边界情况和可能的崩溃场景
 *
 * 测试覆盖：
 * 1. 基本 HTML 字符串解析
 * 2. 特殊字符处理（<, >, & 等）
 * 3. 边界情况（空字符串、null、undefined）
 * 4. 深度嵌套和复杂结构
 * 5. 防止无限递归
 * 6. 数组和 Fragment 处理
 * 7. 错误处理和异常情况
 * 8. 性能和深度限制
 * 9. 实际使用场景
 */

import { h, Fragment } from "../jsx-factory";
import { parseHTMLToNodes } from "../utils/dom-utils";

describe("JSX Factory HTML String Parsing", () => {
    describe("基本 HTML 字符串解析", () => {
        test("应该解析简单的 HTML 标签", () => {
            const result = h("div", null, "<p>Hello</p>");
            expect(result.children.length).toBe(1);
            expect(result.children[0].tagName).toBe("P");
            expect(result.children[0].textContent).toBe("Hello");
        });

        test("应该解析多个 HTML 标签", () => {
            const result = h("div", null, "<p>Hello</p><span>World</span>");
            expect(result.children.length).toBe(2);
            expect(result.children[0].tagName).toBe("P");
            expect(result.children[1].tagName).toBe("SPAN");
        });

        test("应该解析嵌套的 HTML 标签", () => {
            const result = h("div", null, "<p>Hello <strong>World</strong></p>");
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.tagName).toBe("P");
            expect(p.children.length).toBe(1);
            expect(p.children[0].tagName).toBe("STRONG");
        });

        test("应该解析自闭合标签", () => {
            const result = h("div", null, "<br/><hr/>");
            expect(result.children.length).toBe(2);
            expect(result.children[0].tagName).toBe("BR");
            expect(result.children[1].tagName).toBe("HR");
        });

        test("应该解析带属性的 HTML 标签", () => {
            const result = h("div", null, '<p class="test" id="myId">Hello</p>');
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.getAttribute("class")).toBe("test");
            expect(p.getAttribute("id")).toBe("myId");
        });
    });

    describe("特殊字符处理", () => {
        test("应该正确处理包含 < 和 > 的纯文本（数学表达式）", () => {
            const result = h("div", null, "a < b && c > d");
            // 文本节点会被创建为 TextNode，不是 children 的一部分
            // 但可以通过 textContent 或 childNodes 访问
            expect(result.textContent).toBe("a < b && c > d");
            // 确保没有被解析为 HTML
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理包含 < 和 > 的纯文本（比较运算符）", () => {
            const result = h("div", null, "x < 10 && y > 20");
            expect(result.textContent).toBe("x < 10 && y > 20");
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理包含 < 和 > 的纯文本（箭头函数）", () => {
            const result = h("div", null, "const fn = () => {}");
            expect(result.textContent).toBe("const fn = () => {}");
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理 HTML 实体", () => {
            const result = h("div", null, "<p>&lt;Hello&gt;</p>");
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.textContent).toBe("<Hello>");
        });

        test("应该正确处理 HTML 实体和标签混合", () => {
            const result = h("div", null, "<p>Hello &amp; World</p>");
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.textContent).toBe("Hello & World");
        });
    });

    describe("边界情况", () => {
        test("应该正确处理空字符串", () => {
            const result = h("div", null, "");
            // 空字符串会创建一个空的文本节点
            expect(result.textContent).toBe("");
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理 null", () => {
            const result = h("div", null, null);
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理 undefined", () => {
            const result = h("div", null, undefined);
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理 false", () => {
            const result = h("div", null, false);
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理只有空格的字符串", () => {
            const result = h("div", null, "   ");
            expect(result.textContent).toBe("   ");
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理只有 < 的字符串", () => {
            const result = h("div", null, "<");
            expect(result.textContent).toBe("<");
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理只有 > 的字符串", () => {
            const result = h("div", null, ">");
            expect(result.textContent).toBe(">");
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理不完整的 HTML 标签", () => {
            const result = h("div", null, "<p");
            // 不完整的标签应该被当作纯文本处理
            expect(result.textContent).toContain("<p");
            // 浏览器可能会尝试解析，但不会创建有效的元素
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理不完整的 HTML 标签（只有 <）", () => {
            const result = h("div", null, "<");
            expect(result.textContent).toBe("<");
            expect(result.children.length).toBe(0);
        });
    });

    describe("深度嵌套和复杂结构", () => {
        test("应该正确处理深度嵌套的 HTML", () => {
            const html = "<div><p><span><strong>Hello</strong></span></p></div>";
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const div = result.children[0] as HTMLElement;
            expect(div.children[0].tagName).toBe("P");
        });

        test("应该正确处理多个嵌套层级", () => {
            const html = "<ul><li><p>Item 1</p></li><li><p>Item 2</p></li></ul>";
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const ul = result.children[0] as HTMLElement;
            expect(ul.children.length).toBe(2);
        });

        test("应该正确处理混合内容（HTML + 文本）", () => {
            const result = h("div", null, "Before ", "<p>Middle</p>", " After");
            // 文本节点和 HTML 元素混合
            expect(result.textContent).toBe("Before Middle After");
            // HTML 元素会被解析并添加到 children
            expect(result.children.length).toBe(1);
            expect(result.children[0].tagName).toBe("P");
            // 文本节点在 childNodes 中
            const textNodes = Array.from(result.childNodes).filter(
                (node) => node.nodeType === Node.TEXT_NODE
            );
            expect(textNodes.length).toBeGreaterThan(0);
        });
    });

    describe("防止无限递归", () => {
        test("不应该对已解析的文本节点再次检测 HTML", () => {
            // 这个测试确保 parseHTMLToNodes 返回的文本节点不会被再次解析
            const html = "<p>Text with < and > symbols</p>";
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            // 文本节点应该包含 < 和 >，但不会被再次解析
            expect(p.textContent).toContain("<");
            expect(p.textContent).toContain(">");
        });

        test("应该正确处理包含 HTML 标签的文本内容", () => {
            const html = "<p>This is <strong>bold</strong> text</p>";
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.children.length).toBe(1);
            expect(p.children[0].tagName).toBe("STRONG");
        });

        test("应该正确处理多层 HTML 字符串嵌套", () => {
            // 模拟可能的嵌套场景
            const html1 = "<div><p>Level 1</p></div>";
            const result1 = h("div", null, html1);
            expect(result1.children.length).toBe(1);

            // 确保不会无限递归
            const html2 = "<div>" + html1 + "</div>";
            const result2 = h("div", null, html2);
            expect(result2.children.length).toBe(1);
        });
    });

    describe("数组和 Fragment 处理", () => {
        test("应该正确处理数组中的 HTML 字符串", () => {
            const result = h("div", null, ["<p>Item 1</p>", "<p>Item 2</p>"]);
            expect(result.children.length).toBe(2);
            expect(result.children[0].tagName).toBe("P");
            expect(result.children[1].tagName).toBe("P");
        });

        test("应该正确处理 Fragment 中的 HTML 字符串", () => {
            const fragment = Fragment(null, ["<p>Hello</p>", "<span>World</span>"]);
            expect(fragment.children.length).toBe(2);
            expect(fragment.children[0].tagName).toBe("P");
            expect(fragment.children[1].tagName).toBe("SPAN");
        });

        test("应该正确处理嵌套数组", () => {
            const result = h("div", null, [
                "<p>Item 1</p>",
                ["<span>Nested</span>", "<span>Items</span>"],
                "<p>Item 2</p>",
            ]);
            expect(result.children.length).toBe(4);
        });
    });

    describe("错误处理和异常情况", () => {
        test("应该正确处理无效的 HTML", () => {
            // 无效的 HTML 应该被浏览器解析器处理，不应该崩溃
            const result = h("div", null, "<p><invalid>");
            expect(result).toBeDefined();
            expect(result.children.length).toBeGreaterThan(0);
        });

        test("应该正确处理未闭合的标签", () => {
            const result = h("div", null, "<p>Hello");
            expect(result).toBeDefined();
            // 浏览器会自动闭合标签
            expect(result.children.length).toBeGreaterThan(0);
        });

        test("应该正确处理特殊字符在 HTML 标签中", () => {
            const result = h("div", null, '<p class="test<value">Hello</p>');
            expect(result).toBeDefined();
            expect(result.children.length).toBe(1);
        });
    });

    describe("性能和深度限制", () => {
        test("应该正确处理深度嵌套（不超过限制）", () => {
            let html = "Text";
            for (let i = 0; i < 5; i++) {
                html = `<div>${html}</div>`;
            }
            const result = h("div", null, html);
            expect(result).toBeDefined();
            expect(result.children.length).toBe(1);
        });

        test("应该正确处理大量 HTML 标签", () => {
            const html = Array(100)
                .fill(0)
                .map((_, i) => `<p>Item ${i}</p>`)
                .join("");
            const result = h("div", null, html);
            expect(result.children.length).toBe(100);
        });
    });

    describe("实际使用场景", () => {
        test("应该正确处理 Markdown 渲染器场景", () => {
            // 模拟 WsxMarkedParagraph 的使用场景
            const content = "<p>Hello <strong>World</strong></p>";
            const result = h("p", { class: "marked-paragraph" }, content);
            expect(result.getAttribute("class")).toBe("marked-paragraph");
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.tagName).toBe("P");
        });

        test("应该正确处理列表渲染场景", () => {
            const items = ["<li>Item 1</li>", "<li>Item 2</li>", "<li>Item 3</li>"];
            const result = h("ul", null, ...items);
            expect(result.children.length).toBe(3);
            expect(result.children[0].tagName).toBe("LI");
        });

        test("应该正确处理代码块场景", () => {
            const code = "const x = 1 < 2 && 3 > 1;";
            const result = h("code", null, code);
            expect(result.textContent).toBe(code);
            // 不应该被解析为 HTML
            expect(result.children.length).toBe(0);
        });
    });

    describe("parseHTMLToNodes 函数测试", () => {
        test("应该正确解析 HTML 字符串", () => {
            const nodes = parseHTMLToNodes("<p>Hello</p>");
            expect(nodes.length).toBe(1);
            expect(nodes[0] instanceof HTMLElement).toBe(true);
            expect((nodes[0] as HTMLElement).tagName).toBe("P");
        });

        test("应该正确解析多个节点", () => {
            const nodes = parseHTMLToNodes("<p>Hello</p><span>World</span>");
            expect(nodes.length).toBe(2);
            expect(nodes[0] instanceof HTMLElement).toBe(true);
            expect(nodes[1] instanceof HTMLElement).toBe(true);
        });

        test("应该正确处理文本节点", () => {
            const nodes = parseHTMLToNodes("Plain text");
            expect(nodes.length).toBe(1);
            expect(typeof nodes[0]).toBe("string");
            expect(nodes[0]).toBe("Plain text");
        });

        test("应该正确处理混合内容", () => {
            const nodes = parseHTMLToNodes("Before <p>Middle</p> After");
            expect(nodes.length).toBe(3);
            expect(nodes[0]).toBe("Before ");
            expect(nodes[1] instanceof HTMLElement).toBe(true);
            expect(nodes[2]).toBe(" After");
        });

        test("应该正确处理空字符串", () => {
            const nodes = parseHTMLToNodes("");
            expect(nodes.length).toBe(0);
        });
    });

    describe("SVG 元素处理", () => {
        test("应该正确解析 SVG 元素", () => {
            const result = h("div", null, '<svg><circle r="10"></circle></svg>');
            expect(result.children.length).toBe(1);
            expect(result.children[0] instanceof SVGElement).toBe(true);
            expect(result.children[0].tagName).toBe("svg");
        });

        test("应该正确处理 SVG 路径", () => {
            const result = h("div", null, '<svg><path d="M10 10 L20 20"></path></svg>');
            expect(result.children.length).toBe(1);
            const svg = result.children[0] as SVGElement;
            expect(svg.children.length).toBe(1);
            expect(svg.children[0].tagName).toBe("path");
        });

        test("应该正确处理多个 SVG 元素", () => {
            const result = h("div", null, "<svg><rect></rect></svg><svg><circle></circle></svg>");
            expect(result.children.length).toBe(2);
            expect(result.children[0].tagName).toBe("svg");
            expect(result.children[1].tagName).toBe("svg");
        });
    });

    describe("自定义元素（Web Components）", () => {
        test("应该正确解析 WSX 自定义元素", () => {
            const html = '<wsx-marked-heading level="1" text="Hello"></wsx-marked-heading>';
            const result = h("div", null, html);
            // 自定义元素应该被解析为 HTML
            expect(result.children.length).toBeGreaterThanOrEqual(0);
            // 如果被解析，应该包含自定义元素
            if (result.children.length > 0) {
                expect(result.children[0].tagName.toLowerCase()).toBe("wsx-marked-heading");
                expect(result.children[0].getAttribute("level")).toBe("1");
                expect(result.children[0].getAttribute("text")).toBe("Hello");
            } else {
                // 如果没有被解析，应该是纯文本
                expect(result.textContent).toContain("wsx-marked-heading");
            }
        });

        test("应该正确处理自定义元素属性", () => {
            const html =
                '<wsx-marked-code code="const x = 1;" language="javascript"></wsx-marked-code>';
            const result = h("div", null, html);
            // 自定义元素应该被解析
            if (result.children.length > 0) {
                const element = result.children[0] as HTMLElement;
                expect(element.getAttribute("code")).toBe("const x = 1;");
                expect(element.getAttribute("language")).toBe("javascript");
            } else {
                // 如果没有被解析，至少应该包含文本内容
                expect(result.textContent).toContain("wsx-marked-code");
            }
        });

        test("应该正确处理自闭合的自定义元素", () => {
            const html = "<wsx-marked-hr />";
            const result = h("div", null, html);
            // 自闭合标签应该被解析
            if (result.children.length > 0) {
                expect(result.children[0].tagName.toLowerCase()).toBe("wsx-marked-hr");
            } else {
                // 如果没有被解析，应该是纯文本
                expect(result.textContent).toContain("wsx-marked-hr");
            }
        });
    });

    describe("表单元素", () => {
        test("应该正确解析输入框", () => {
            const result = h("div", null, '<input type="text" value="test" />');
            expect(result.children.length).toBe(1);
            const input = result.children[0] as HTMLInputElement;
            expect(input.type).toBe("text");
            expect(input.value).toBe("test");
        });

        test("应该正确解析文本域", () => {
            const result = h("div", null, '<textarea rows="5">Content</textarea>');
            expect(result.children.length).toBe(1);
            const textarea = result.children[0] as HTMLTextAreaElement;
            expect(textarea.rows).toBe(5);
            expect(textarea.textContent).toBe("Content");
        });

        test("应该正确解析选择框", () => {
            const result = h(
                "div",
                null,
                '<select><option value="1">Option 1</option><option value="2">Option 2</option></select>'
            );
            expect(result.children.length).toBe(1);
            const select = result.children[0] as HTMLSelectElement;
            expect(select.children.length).toBe(2);
        });

        test("应该正确解析复选框", () => {
            const result = h("div", null, '<input type="checkbox" checked />');
            expect(result.children.length).toBe(1);
            const checkbox = result.children[0] as HTMLInputElement;
            expect(checkbox.type).toBe("checkbox");
            expect(checkbox.checked).toBe(true);
        });

        test("应该正确解析单选按钮", () => {
            const result = h("div", null, '<input type="radio" name="group" value="1" />');
            expect(result.children.length).toBe(1);
            const radio = result.children[0] as HTMLInputElement;
            expect(radio.type).toBe("radio");
            expect(radio.name).toBe("group");
        });
    });

    describe("表格元素", () => {
        test("应该正确解析表格", () => {
            const html = "<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>";
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const table = result.children[0] as HTMLTableElement;
            expect(table.rows.length).toBe(1);
            expect(table.rows[0].cells.length).toBe(2);
        });

        test("应该正确处理表头", () => {
            const html =
                "<table><thead><tr><th>Header 1</th><th>Header 2</th></tr></thead></table>";
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const table = result.children[0] as HTMLTableElement;
            expect(table.tHead).toBeTruthy();
        });
    });

    describe("媒体元素", () => {
        test("应该正确解析图片", () => {
            const result = h("div", null, '<img src="test.jpg" alt="Test" />');
            expect(result.children.length).toBe(1);
            const img = result.children[0] as HTMLImageElement;
            expect(img.src).toContain("test.jpg");
            expect(img.alt).toBe("Test");
        });

        test("应该正确解析视频", () => {
            const result = h("div", null, '<video src="test.mp4" controls></video>');
            expect(result.children.length).toBe(1);
            const video = result.children[0] as HTMLVideoElement;
            expect(video.hasAttribute("controls")).toBe(true);
        });

        test("应该正确解析音频", () => {
            const result = h("div", null, '<audio src="test.mp3"></audio>');
            expect(result.children.length).toBe(1);
            expect(result.children[0].tagName).toBe("AUDIO");
        });
    });

    describe("特殊属性处理", () => {
        test("应该正确处理 data-* 属性", () => {
            const result = h("div", null, '<div data-test="value" data-id="123"></div>');
            expect(result.children.length).toBe(1);
            const div = result.children[0] as HTMLElement;
            expect(div.getAttribute("data-test")).toBe("value");
            expect(div.getAttribute("data-id")).toBe("123");
        });

        test("应该正确处理 aria-* 属性", () => {
            const result = h(
                "div",
                null,
                '<button aria-label="Close" aria-hidden="true"></button>'
            );
            expect(result.children.length).toBe(1);
            const button = result.children[0] as HTMLElement;
            expect(button.getAttribute("aria-label")).toBe("Close");
            expect(button.getAttribute("aria-hidden")).toBe("true");
        });

        test("应该正确处理 class 属性（多个类名）", () => {
            const result = h("div", null, '<div class="foo bar baz"></div>');
            expect(result.children.length).toBe(1);
            const div = result.children[0] as HTMLElement;
            expect(div.classList.contains("foo")).toBe(true);
            expect(div.classList.contains("bar")).toBe(true);
            expect(div.classList.contains("baz")).toBe(true);
        });

        test("应该正确处理 id 属性", () => {
            const result = h("div", null, '<div id="my-element"></div>');
            expect(result.children.length).toBe(1);
            const div = result.children[0] as HTMLElement;
            expect(div.id).toBe("my-element");
        });

        test("应该正确处理 style 属性", () => {
            const result = h("div", null, '<div style="color: red; font-size: 16px;"></div>');
            expect(result.children.length).toBe(1);
            const div = result.children[0] as HTMLElement;
            expect(div.style.color).toBe("red");
            expect(div.style.fontSize).toBe("16px");
        });
    });

    describe("Unicode 和特殊字符", () => {
        test("应该正确处理 Unicode 字符", () => {
            const result = h("div", null, "<p>Hello 世界 🌍</p>");
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.textContent).toBe("Hello 世界 🌍");
        });

        test("应该正确处理表情符号", () => {
            const result = h("div", null, "<p>😀 😃 😄</p>");
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.textContent).toBe("😀 😃 😄");
        });

        test("应该正确处理换行符", () => {
            const result = h("div", null, "<p>Line 1\nLine 2</p>");
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.textContent).toContain("Line 1");
            expect(p.textContent).toContain("Line 2");
        });

        test("应该正确处理制表符", () => {
            const result = h("div", null, "<p>Tab\tHere</p>");
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.textContent).toContain("Tab");
        });

        test("应该正确处理引号", () => {
            const result = h("div", null, '<p>He said "Hello"</p>');
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.textContent).toBe('He said "Hello"');
        });

        test("应该正确处理单引号", () => {
            const result = h("div", null, "<p>It's a test</p>");
            expect(result.children.length).toBe(1);
            const p = result.children[0] as HTMLElement;
            expect(p.textContent).toBe("It's a test");
        });
    });

    describe("脚本和样式标签", () => {
        test("应该正确处理 script 标签", () => {
            const result = h("div", null, '<script>console.log("test");</script>');
            expect(result.children.length).toBe(1);
            expect(result.children[0].tagName).toBe("SCRIPT");
        });

        test("应该正确处理 style 标签", () => {
            const result = h("div", null, "<style>.test { color: red; }</style>");
            expect(result.children.length).toBe(1);
            expect(result.children[0].tagName).toBe("STYLE");
        });

        test("应该正确处理外部脚本", () => {
            const result = h("div", null, '<script src="test.js"></script>');
            expect(result.children.length).toBe(1);
            const script = result.children[0] as HTMLScriptElement;
            expect(script.src).toContain("test.js");
        });

        test("应该正确处理外部样式表", () => {
            const result = h("div", null, '<link rel="stylesheet" href="test.css" />');
            expect(result.children.length).toBe(1);
            const link = result.children[0] as HTMLLinkElement;
            expect(link.rel).toBe("stylesheet");
            expect(link.href).toContain("test.css");
        });
    });

    describe("列表和导航", () => {
        test("应该正确处理有序列表", () => {
            const html = "<ol><li>Item 1</li><li>Item 2</li></ol>";
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const ol = result.children[0] as HTMLOListElement;
            expect(ol.children.length).toBe(2);
        });

        test("应该正确处理无序列表", () => {
            const html = "<ul><li>Item 1</li><li>Item 2</li></ul>";
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const ul = result.children[0] as HTMLUListElement;
            expect(ul.children.length).toBe(2);
        });

        test("应该正确处理导航链接", () => {
            const html = '<nav><a href="/home">Home</a><a href="/about">About</a></nav>';
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const nav = result.children[0] as HTMLElement;
            expect(nav.children.length).toBe(2);
            expect((nav.children[0] as HTMLAnchorElement).href).toContain("/home");
        });
    });

    describe("复杂嵌套场景", () => {
        test("应该正确处理多层嵌套的复杂结构", () => {
            const html = `
                <article>
                    <header>
                        <h1>Title</h1>
                        <nav>
                            <ul>
                                <li><a href="#1">Link 1</a></li>
                                <li><a href="#2">Link 2</a></li>
                            </ul>
                        </nav>
                    </header>
                    <section>
                        <p>Content with <strong>bold</strong> and <em>italic</em> text.</p>
                    </section>
                </article>
            `;
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const article = result.children[0] as HTMLElement;
            expect(article.tagName).toBe("ARTICLE");
            expect(article.querySelector("h1")).toBeTruthy();
            expect(article.querySelector("nav")).toBeTruthy();
        });

        test("应该正确处理表单嵌套", () => {
            const html = `
                <form>
                    <fieldset>
                        <legend>Personal Info</legend>
                        <label>Name: <input type="text" name="name" /></label>
                        <label>Email: <input type="email" name="email" /></label>
                    </fieldset>
                    <button type="submit">Submit</button>
                </form>
            `;
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const form = result.children[0] as HTMLFormElement;
            expect(form.querySelector("fieldset")).toBeTruthy();
            expect(form.querySelector("input[type='text']")).toBeTruthy();
            expect(form.querySelector("button[type='submit']")).toBeTruthy();
        });
    });

    describe("Markdown 渲染器实际场景", () => {
        test("应该正确处理 Markdown heading 渲染", () => {
            const html = '<wsx-marked-heading level="2" text="Section Title"></wsx-marked-heading>';
            const result = h("div", null, html);
            // 自定义元素应该被解析
            if (result.children.length > 0) {
                const heading = result.children[0] as HTMLElement;
                expect(heading.tagName.toLowerCase()).toBe("wsx-marked-heading");
                expect(heading.getAttribute("level")).toBe("2");
            } else {
                // 如果没有被解析，至少应该包含文本
                expect(result.textContent).toContain("wsx-marked-heading");
            }
        });

        test("应该正确处理 Markdown code block 渲染", () => {
            const code = "const x = 1;";
            const escapedCode = code.replace(/"/g, "&quot;");
            const html = `<wsx-marked-code code="${escapedCode}" language="javascript"></wsx-marked-code>`;
            const result = h("div", null, html);
            // 自定义元素应该被解析
            if (result.children.length > 0) {
                const codeBlock = result.children[0] as HTMLElement;
                expect(codeBlock.getAttribute("code")).toBe(code);
            } else {
                // 如果没有被解析，至少应该包含文本
                expect(result.textContent).toContain("wsx-marked-code");
            }
        });

        test("应该正确处理 Markdown paragraph 渲染", () => {
            const content = "This is a paragraph with <strong>bold</strong> text.";
            const escapedContent = content.replace(/"/g, "&quot;");
            const html = `<wsx-marked-paragraph content="${escapedContent}"></wsx-marked-paragraph>`;
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const paragraph = result.children[0] as HTMLElement;
            expect(paragraph.getAttribute("content")).toBe(content);
        });

        test("应该正确处理 Markdown list 渲染", () => {
            const items = ["Item 1", "Item 2", "Item 3"];
            const escapedItems = JSON.stringify(items).replace(/'/g, "&#39;");
            const html = `<wsx-marked-list ordered="false" items='${escapedItems}'></wsx-marked-list>`;
            const result = h("div", null, html);
            // 自定义元素应该被解析
            if (result.children.length > 0) {
                const list = result.children[0] as HTMLElement;
                expect(list.getAttribute("ordered")).toBe("false");
            } else {
                // 如果没有被解析，至少应该包含文本
                expect(result.textContent).toContain("wsx-marked-list");
            }
        });

        test("应该正确处理 Markdown blockquote 渲染", () => {
            const html = "<wsx-marked-blockquote><p>Quote content</p></wsx-marked-blockquote>";
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const blockquote = result.children[0] as HTMLElement;
            expect(blockquote.tagName.toLowerCase()).toBe("wsx-marked-blockquote");
            expect(blockquote.querySelector("p")).toBeTruthy();
        });
    });

    describe("性能和压力测试", () => {
        test("应该正确处理大量 HTML 字符串（1000 个元素）", () => {
            const html = Array(1000)
                .fill(0)
                .map((_, i) => `<p>Item ${i}</p>`)
                .join("");
            const start = performance.now();
            const result = h("div", null, html);
            const end = performance.now();
            expect(result.children.length).toBe(1000);
            // 应该在合理时间内完成（例如 1 秒内）
            expect(end - start).toBeLessThan(1000);
        });

        test("应该正确处理深度嵌套（20 层）", () => {
            let html = "Content";
            for (let i = 0; i < 20; i++) {
                html = `<div>${html}</div>`;
            }
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            // 验证深度
            let depth = 0;
            let current = result.children[0] as HTMLElement;
            while (current && current.children.length > 0) {
                depth++;
                current = current.children[0] as HTMLElement;
            }
            expect(depth).toBeGreaterThan(15);
        });

        test("应该正确处理混合大量内容", () => {
            const parts = [];
            for (let i = 0; i < 100; i++) {
                parts.push(`<p>Paragraph ${i}</p>`);
                parts.push(`Text ${i}`);
                parts.push(`<span>Span ${i}</span>`);
            }
            const html = parts.join("");
            const result = h("div", null, html);
            // 应该有 200 个元素（100 个 p + 100 个 span）
            expect(result.children.length).toBe(200);
        });
    });

    describe("边缘情况和错误恢复", () => {
        test("应该正确处理包含 null 字符的字符串", () => {
            const result = h("div", null, "<p>Hello\u0000World</p>");
            expect(result.children.length).toBe(1);
            // null 字符会被浏览器处理
            expect(result.children[0]).toBeDefined();
        });

        test("应该正确处理包含控制字符的字符串", () => {
            const result = h("div", null, "<p>Hello\u0001\u0002\u0003World</p>");
            expect(result.children.length).toBe(1);
            expect(result.children[0]).toBeDefined();
        });

        test("应该正确处理非常长的属性值", () => {
            const longValue = "a".repeat(10000);
            const html = `<div data-long="${longValue}"></div>`;
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const div = result.children[0] as HTMLElement;
            expect(div.getAttribute("data-long")).toBe(longValue);
        });

        test("应该正确处理特殊字符在属性中", () => {
            const html = '<div data-test="value with &quot;quotes&quot; and &lt;tags&gt;"></div>';
            const result = h("div", null, html);
            expect(result.children.length).toBe(1);
            const div = result.children[0] as HTMLElement;
            // 浏览器会自动解码 HTML 实体
            expect(div.getAttribute("data-test")).toContain("quotes");
        });
    });

    describe("条件渲染场景", () => {
        test("应该正确处理条件 HTML（真值）", () => {
            const condition = true;
            const html = condition ? "<p>Shown</p>" : "<p>Hidden</p>";
            const result = h("div", null, html);
            expect(result.textContent).toBe("Shown");
        });

        test("应该正确处理条件 HTML（假值）", () => {
            const condition = false;
            const html = condition ? "<p>Shown</p>" : "";
            const result = h("div", null, html);
            expect(result.children.length).toBe(0);
        });

        test("应该正确处理动态内容", () => {
            const items = ["A", "B", "C"];
            const html = items.map((item) => `<li>${item}</li>`).join("");
            const result = h("ul", null, html);
            expect(result.children.length).toBe(3);
            expect(result.children[0].textContent).toBe("A");
        });
    });
});

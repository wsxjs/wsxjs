/**
 * Update Children Helpers 测试
 *
 * 测试从 updateChildren 中拆分出来的纯函数辅助函数
 */

import {
    collectPreservedElements,
    findElementNode,
    findTextNode,
    updateOrCreateTextNode,
    removeNodeIfNotPreserved,
    replaceOrInsertElement,
    appendNewChild,
    buildNodeMaps,
    shouldRemoveNode,
    deduplicateCacheKeys,
    collectNodesToRemove,
    removeNodes,
    reinsertPreservedElements,
} from "../utils/update-children-helpers";
import { markElement, getElementCacheKey } from "../utils/element-marking";
import { h } from "../jsx-factory";

describe("collectPreservedElements", () => {
    test("应该收集所有应该保留的元素", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const preserved1 = document.createElement("div");
        preserved1.setAttribute("data-wsx-preserve", "");
        const preserved2 = document.createElement("div"); // 没有标记，应该被保留
        const frameworkElement = h("div", { id: "framework" }, "Framework");

        parent.appendChild(preserved1);
        parent.appendChild(frameworkElement);
        parent.appendChild(preserved2);

        const preserved = collectPreservedElements(parent);
        expect(preserved).toHaveLength(2);
        expect(preserved).toContain(preserved1);
        expect(preserved).toContain(preserved2);
        expect(preserved).not.toContain(frameworkElement);
    });

    test("应该返回空数组如果没有保留元素", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const frameworkElement = h("div", { id: "framework" }, "Framework");
        parent.appendChild(frameworkElement);

        const preserved = collectPreservedElements(parent);
        expect(preserved).toHaveLength(0);
    });
});

describe("findElementNode", () => {
    test("应该通过元素引用找到节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const element = h("div", { id: "test" }, "Test");
        parent.appendChild(element);

        const found = findElementNode(element, parent);
        expect(found).toBe(element);
    });

    test("应该通过 cache key 找到节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const element1 = h("div", { id: "test", key: "test-key" }, "Test");
        parent.appendChild(element1);
        // Cache key is used implicitly by findElementNode
        getElementCacheKey(element1);

        // 创建一个新的元素，但具有相同的 cache key
        const element2 = h("div", { id: "test", key: "test-key" }, "Test");
        // 注意：element2 不在 DOM 中，但应该通过 cache key 找到 element1
        const found = findElementNode(element2, parent);
        expect(found).toBe(element1);
    });

    test("应该返回 null 如果元素不在 DOM 中且没有匹配的 cache key", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const element = h("div", { id: "test" }, "Test");

        const found = findElementNode(element, parent);
        expect(found).toBeNull();
    });

    test("应该跳过保留的元素", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const preserved = document.createElement("div");
        preserved.setAttribute("data-wsx-preserve", "");
        parent.appendChild(preserved);

        const found = findElementNode(preserved, parent);
        // 保留的元素不应该被找到（因为它们不应该在更新循环中处理）
        expect(found).toBeNull();
    });
});

describe("findTextNode", () => {
    test("应该找到第一个文本节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const textNode = document.createTextNode("Text");
        (textNode as any).__wsxManaged = true;
        parent.appendChild(textNode);

        const domIndex = { value: 0 };
        const found = findTextNode(parent, domIndex, new Set<Node>());
        // The index logic might differ slightly based on impl details, but let's ensure it found the node
        expect(found).toBe(textNode);
    });

    test("应该跳过元素节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const element = h("div", { id: "test" }, "Test");
        const textNode = document.createTextNode("Text");
        (textNode as any).__wsxManaged = true;
        parent.appendChild(element);
        parent.appendChild(textNode);

        const domIndex = { value: 0 };
        const found = findTextNode(parent, domIndex, new Set<Node>());
        expect(found).toBe(textNode);
    });

    test("应该返回 null 如果没有找到文本节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const element = h("div", { id: "test" }, "Test");
        parent.appendChild(element);

        const domIndex = { value: 0 };
        const found = findTextNode(parent, domIndex, new Set<Node>());
        expect(found).toBeNull();
    });
});

describe("updateOrCreateTextNode", () => {
    test("应该更新现有文本节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const textNode = document.createTextNode("Old");
        (textNode as any).__wsxManaged = true;
        parent.appendChild(textNode);

        updateOrCreateTextNode(parent, textNode, "New");
        expect(textNode.textContent).toBe("New");
        expect(parent.childNodes.length).toBe(1);
    });

    test("应该创建新文本节点如果 oldNode 不存在", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");

        updateOrCreateTextNode(parent, null, "New");
        expect(parent.childNodes.length).toBe(1);
        expect(parent.firstChild?.textContent).toBe("New");
    });

    test("应该替换 oldNode 如果它不是文本节点且不应该保留", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const element = h("div", { id: "test" }, "Test");
        parent.appendChild(element);

        updateOrCreateTextNode(parent, element, "New");
        expect(parent.childNodes.length).toBe(1);
        expect(parent.firstChild?.nodeType).toBe(Node.TEXT_NODE);
        expect(parent.firstChild?.textContent).toBe("New");
    });

    test("应该在保留元素之前插入新文本节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const preserved = document.createElement("div");
        preserved.setAttribute("data-wsx-preserve", "");
        parent.appendChild(preserved);

        updateOrCreateTextNode(parent, preserved, "New", preserved);
        expect(parent.childNodes.length).toBe(2);
        expect(parent.firstChild?.textContent).toBe("New");
        expect(parent.lastChild).toBe(preserved);
    });

    test("当 oldNode 存在且内容相同时不应该更新", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const textNode = document.createTextNode("Same");
        (textNode as any).__wsxManaged = true;
        parent.appendChild(textNode);

        updateOrCreateTextNode(parent, textNode, "Same");
        expect(textNode.textContent).toBe("Same");
        expect(parent.childNodes.length).toBe(1);
    });

    test("当 oldNode 为 null 时，应该创建新的文本节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const textNode1 = document.createTextNode("First");
        const textNode2 = document.createTextNode("Second");
        parent.appendChild(textNode1);
        parent.appendChild(textNode2);

        // 当 oldNode 为 null 时，应该创建新节点而不是更新现有节点
        // 因为不知道应该更新哪个文本节点
        updateOrCreateTextNode(parent, null, "New");
        expect(parent.childNodes.length).toBe(3);
        expect(parent.firstChild).toBe(textNode1);
        expect(textNode1.textContent).toBe("First"); // 未改变
        expect(textNode2.textContent).toBe("Second"); // 未改变
        expect(parent.lastChild?.textContent).toBe("New"); // 新节点
    });

    test("当 oldNode 为 null 且没有现有文本节点时，应该创建新节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");

        updateOrCreateTextNode(parent, null, "New");
        expect(parent.childNodes.length).toBe(1);
        expect(parent.firstChild?.textContent).toBe("New");
    });

    test("应该使用 insertBeforeNode 指定插入位置", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const node1 = document.createElement("div");
        const node2 = document.createElement("div");
        parent.appendChild(node1);
        parent.appendChild(node2);

        // 插入文本到 node1 和 node2 之间
        updateOrCreateTextNode(parent, null, "Inserted", node2);

        expect(parent.childNodes.length).toBe(3);
        expect(parent.childNodes[1].textContent).toBe("Inserted");
        expect(parent.childNodes[1].nextSibling).toBe(node2);
    });

    test("当 oldNode 为 null 但存在相同内容的节点时，仍应创建新节点（无内容匹配搜索）", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const existingText = document.createTextNode("Existing");
        parent.appendChild(existingText);

        // 旧逻辑可能会找到 existingText 并返回它
        // 新逻辑应该忽略它并创建新节点
        const newNode = updateOrCreateTextNode(parent, null, "Existing");

        expect(newNode).not.toBe(existingText);
        expect(parent.childNodes.length).toBe(2);
        expect(parent.lastChild).toBe(newNode);
        expect(parent.lastChild?.textContent).toBe("Existing");
    });
});

describe("removeNodeIfNotPreserved", () => {
    test("应该移除不应该保留的节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const element = h("div", { id: "test" }, "Test");
        parent.appendChild(element);

        removeNodeIfNotPreserved(parent, element);
        expect(parent.childNodes.length).toBe(0);
    });

    test("不应该移除应该保留的节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const preserved = document.createElement("div");
        preserved.setAttribute("data-wsx-preserve", "");
        parent.appendChild(preserved);

        removeNodeIfNotPreserved(parent, preserved);
        expect(parent.childNodes.length).toBe(1);
    });

    test("应该处理 null 节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        expect(() => removeNodeIfNotPreserved(parent, null)).not.toThrow();
    });
});

describe("replaceOrInsertElement", () => {
    test("应该替换现有元素", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const oldElement = h("div", { id: "old" }, "Old");
        const newElement = h("div", { id: "new" }, "New");
        parent.appendChild(oldElement);

        replaceOrInsertElement(parent, newElement, oldElement);
        expect(parent.childNodes.length).toBe(1);
        expect(parent.firstChild).toBe(newElement);
    });

    test("应该插入新元素如果 oldNode 不存在", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const newElement = h("div", { id: "new" }, "New");

        replaceOrInsertElement(parent, newElement, null);
        expect(parent.childNodes.length).toBe(1);
        expect(parent.firstChild).toBe(newElement);
    });

    test("应该从其他父元素移除新元素", () => {
        const parent1 = document.createElement("div");
        const parent2 = document.createElement("div");
        const newElement = h("div", { id: "new" }, "New");
        parent1.appendChild(newElement);

        replaceOrInsertElement(parent2, newElement, null);
        expect(parent1.childNodes.length).toBe(0);
        expect(parent2.childNodes.length).toBe(1);
        expect(parent2.firstChild).toBe(newElement);
    });

    test("不应该替换如果 oldNode 是保留元素", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const preserved = document.createElement("div");
        preserved.setAttribute("data-wsx-preserve", "");
        const newElement = h("div", { id: "new" }, "New");
        parent.appendChild(preserved);

        replaceOrInsertElement(parent, newElement, preserved);
        expect(parent.childNodes.length).toBe(2);
        expect(parent.firstChild).toBe(newElement);
        expect(parent.lastChild).toBe(preserved);
    });
});

describe("appendNewChild", () => {
    test("应该添加文本节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        appendNewChild(parent, "Text");
        expect(parent.childNodes.length).toBe(1);
        expect(parent.firstChild?.textContent).toBe("Text");
    });

    test("应该添加元素节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const element = h("div", { id: "test" }, "Test");
        appendNewChild(parent, element);
        expect(parent.childNodes.length).toBe(1);
        expect(parent.firstChild).toBe(element);
    });

    test("应该跳过 null/undefined/false", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        appendNewChild(parent, null);
        appendNewChild(parent, undefined);
        appendNewChild(parent, false);
        expect(parent.childNodes.length).toBe(0);
    });

    test("应该从其他父元素移除元素", () => {
        const parent1 = document.createElement("div");
        const parent2 = document.createElement("div");
        const element = h("div", { id: "test" }, "Test");
        parent1.appendChild(element);

        appendNewChild(parent2, element);
        expect(parent1.childNodes.length).toBe(0);
        expect(parent2.childNodes.length).toBe(1);
    });
});

describe("buildNodeMaps", () => {
    test("应该构建元素集合和 cache key 映射", () => {
        const element1 = h("div", { id: "test1", key: "key1" }, "Test1");
        const element2 = h("div", { id: "test2", key: "key2" }, "Test2");
        const fragment = document.createDocumentFragment();

        const { elementSet, cacheKeyMap } = buildNodeMaps([element1, element2, fragment]);

        expect(elementSet.has(element1)).toBe(true);
        expect(elementSet.has(element2)).toBe(true);
        expect(elementSet.has(fragment)).toBe(true);

        const key1 = getElementCacheKey(element1);
        const key2 = getElementCacheKey(element2);
        expect(cacheKeyMap.has(key1 || "")).toBe(true);
        expect(cacheKeyMap.has(key2 || "")).toBe(true);
        expect(cacheKeyMap.get(key1 || "")).toBe(element1);
        expect(cacheKeyMap.get(key2 || "")).toBe(element2);
    });

    test("应该跳过文本节点", () => {
        const { elementSet, cacheKeyMap } = buildNodeMaps(["text", 123]);
        expect(elementSet.size).toBe(0);
        expect(cacheKeyMap.size).toBe(0);
    });
});

describe("shouldRemoveNode", () => {
    test("应该返回 false 对于保留的元素", () => {
        const preserved = document.createElement("div");
        preserved.setAttribute("data-wsx-preserve", "");
        const elementSet = new Set<HTMLElement | SVGElement | DocumentFragment>();
        const cacheKeyMap = new Map<string, HTMLElement | SVGElement>();

        expect(shouldRemoveNode(preserved, elementSet, cacheKeyMap, undefined)).toBe(false);
    });

    test("应该返回 false 对于在新子元素集合中的元素（需提供 processedNodes）", () => {
        const element = h("div", { id: "test" }, "Test");
        const elementSet = new Set([element]);
        const cacheKeyMap = new Map();
        const processedNodes = new Set([element]);

        expect(shouldRemoveNode(element, elementSet, cacheKeyMap, processedNodes)).toBe(false);
    });

    test("应该返回 false 对于通过 cache key 匹配的元素（需提供 processedNodes）", () => {
        const element = h("div", { id: "test", key: "test-key" }, "Test");
        const cacheKey = getElementCacheKey(element) || "";
        const elementSet = new Set<HTMLElement | SVGElement | DocumentFragment>();
        const cacheKeyMap = new Map<string, HTMLElement | SVGElement>([[cacheKey, element]]);
        const processedNodes = new Set([element]);

        expect(shouldRemoveNode(element, elementSet, cacheKeyMap, processedNodes)).toBe(false);
    });

    test("应该返回 true 对于应该移除的节点", () => {
        const element = h("div", { id: "test" }, "Test");
        const elementSet = new Set<HTMLElement | SVGElement | DocumentFragment>();
        const cacheKeyMap = new Map<string, HTMLElement | SVGElement>();

        expect(shouldRemoveNode(element, elementSet, cacheKeyMap, undefined)).toBe(true);
    });
});

describe("deduplicateCacheKeys", () => {
    test("应该替换具有相同 cache key 的旧元素", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const oldElement = h("div", { id: "test", key: "test-key" }, "Old");
        const newElement = h("div", { id: "test", key: "test-key" }, "New");
        parent.appendChild(oldElement);

        const cacheKey = getElementCacheKey(newElement) || "";
        const cacheKeyMap = new Map([[cacheKey, newElement]]);

        // 关键修复：在 deduplicateCacheKeys 中，只有当 newElement 已经在 DOM 中时才会替换
        // 所以我们需要先将 newElement 添加到 DOM（模拟 updateChildren 的完整流程）
        parent.appendChild(newElement);

        deduplicateCacheKeys(parent, cacheKeyMap);
        expect(parent.childNodes.length).toBe(1);
        expect(parent.firstChild).toBe(newElement);
    });

    test("应该跳过保留的元素", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const preserved = document.createElement("div");
        preserved.setAttribute("data-wsx-preserve", "");
        const cacheKey = "preserved-key";
        markElement(preserved, cacheKey);
        parent.appendChild(preserved);

        const newElement = h("div", { id: "test", key: "test-key" }, "New");
        const cacheKeyMap = new Map([[cacheKey, newElement]]);

        deduplicateCacheKeys(parent, cacheKeyMap);
        expect(parent.childNodes.length).toBe(1);
        expect(parent.firstChild).toBe(preserved);
    });
});

describe("collectNodesToRemove", () => {
    test("应该收集应该移除的节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const element1 = h("div", { id: "test1" }, "Test1");
        const element2 = h("div", { id: "test2" }, "Test2");
        parent.appendChild(element1);
        parent.appendChild(element2);

        const elementSet = new Set([element1]);
        const cacheKeyMap = new Map();
        // 模拟 element1 被处理了，所以不应该被移除
        const processedNodes = new Set([element1]);

        const nodesToRemove = collectNodesToRemove(parent, elementSet, cacheKeyMap, processedNodes);
        expect(nodesToRemove).toHaveLength(1);
        expect(nodesToRemove).toContain(element2);
    });

    test("不应该收集保留的元素", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const preserved = document.createElement("div");
        preserved.setAttribute("data-wsx-preserve", "");
        parent.appendChild(preserved);

        const elementSet = new Set<HTMLElement | SVGElement | DocumentFragment>();
        const cacheKeyMap = new Map<string, HTMLElement | SVGElement>();

        const nodesToRemove = collectNodesToRemove(parent, elementSet, cacheKeyMap);
        expect(nodesToRemove).toHaveLength(0);
    });
});

describe("removeNodes", () => {
    test("应该批量移除节点", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const element1 = h("div", { id: "test1" }, "Test1");
        const element2 = h("div", { id: "test2" }, "Test2");
        parent.appendChild(element1);
        parent.appendChild(element2);

        removeNodes(parent, [element1, element2]);
        expect(parent.childNodes.length).toBe(0);
    });

    test("应该从后往前移除避免索引问题", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const elements = Array.from({ length: 5 }, (_, i) => {
            const el = h("div", { id: `test${i}` }, `Test${i}`);
            parent.appendChild(el);
            return el;
        });

        removeNodes(parent, elements);
        expect(parent.childNodes.length).toBe(0);
    });
});

describe("reinsertPreservedElements", () => {
    test("应该重新插入不在 DOM 中的保留元素", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const preserved = document.createElement("div");
        preserved.setAttribute("data-wsx-preserve", "");
        preserved.textContent = "Preserved";

        reinsertPreservedElements(parent, [preserved]);
        expect(parent.childNodes.length).toBe(1);
        expect(parent.firstChild).toBe(preserved);
    });

    test("不应该移动已经在 DOM 中的保留元素", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const preserved = document.createElement("div");
        preserved.setAttribute("data-wsx-preserve", "");
        preserved.textContent = "Preserved";
        parent.appendChild(preserved);

        const initialLength = parent.childNodes.length;
        reinsertPreservedElements(parent, [preserved]);
        expect(parent.childNodes.length).toBe(initialLength);
        expect(parent.firstChild).toBe(preserved);
    });

    test("应该处理多个保留元素", () => {
        const parent = document.createElement("div");
        markElement(parent, "pk");
        const preserved1 = document.createElement("div");
        preserved1.setAttribute("data-wsx-preserve", "");
        const preserved2 = document.createElement("div");
        preserved2.setAttribute("data-wsx-preserve", "");

        reinsertPreservedElements(parent, [preserved1, preserved2]);
        expect(parent.childNodes.length).toBe(2);
        expect(parent.firstChild).toBe(preserved1);
        expect(parent.lastChild).toBe(preserved2);
    });
});

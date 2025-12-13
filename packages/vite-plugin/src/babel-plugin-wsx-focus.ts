/**
 * Babel plugin to automatically add data-wsx-key attributes to focusable elements
 *
 * Transforms:
 *   <input value={this.name} onInput={this.handleInput} />
 *
 * To:
 *   <input
 *     data-wsx-key="MyComponent-input-text-0-0"
 *     value={this.name}
 *     onInput={this.handleInput}
 *   />
 *
 * This enables automatic focus preservation during component rerenders.
 */

import type { PluginObj, NodePath } from "@babel/core";
import type * as t from "@babel/types";
import * as tModule from "@babel/types";

/**
 * Focusable HTML elements that need keys
 */
const FOCUSABLE_ELEMENTS = new Set([
    "input",
    "textarea",
    "select",
    "button", // Also focusable
]);

/**
 * Check if an element is focusable
 */
function isFocusableElement(tagName: string, hasContentEditable: boolean): boolean {
    const lowerTag = tagName.toLowerCase();
    return FOCUSABLE_ELEMENTS.has(lowerTag) || hasContentEditable;
}

/**
 * Extract props from JSX attributes for key generation
 */
function extractPropsFromJSXAttributes(attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[]): {
    id?: string;
    name?: string;
    type?: string;
} {
    const props: { id?: string; name?: string; type?: string } = {};

    for (const attr of attributes) {
        if (tModule.isJSXAttribute(attr) && tModule.isJSXIdentifier(attr.name)) {
            const keyName = attr.name.name;

            if (keyName === "id" || keyName === "name" || keyName === "type") {
                if (tModule.isStringLiteral(attr.value)) {
                    props[keyName as "id" | "name" | "type"] = attr.value.value;
                } else if (
                    tModule.isJSXExpressionContainer(attr.value) &&
                    tModule.isStringLiteral(attr.value.expression)
                ) {
                    props[keyName as "id" | "name" | "type"] = attr.value.expression.value;
                }
            }
        }
    }

    return props;
}

/**
 * Generate stable key for an element
 * @param tagName - HTML tag name
 * @param componentName - Component class name
 * @param path - Path from root (array of sibling indices)
 * @param props - Element properties (for id, name, type)
 * @returns Stable key string
 */
function generateStableKey(
    tagName: string,
    componentName: string,
    path: number[],
    props: { id?: string; name?: string; type?: string }
): string {
    const pathStr = path.join("-");
    const lowerTag = tagName.toLowerCase();

    // Priority: id > name > type + path
    if (props.id) {
        return `${componentName}-${props.id}`;
    }

    if (props.name) {
        return `${componentName}-${props.name}`;
    }

    // Default: component-tag-type-path
    const typeStr = props.type || "text";
    return `${componentName}-${lowerTag}-${typeStr}-${pathStr}`;
}

/**
 * Calculate path from root JSX element
 */
function calculateJSXPath(path: NodePath<t.JSXOpeningElement>): number[] {
    const pathArray: number[] = [];
    let currentPath: NodePath | null = path.parentPath; // JSXElement

    // Walk up to find siblings
    while (currentPath) {
        if (currentPath.isJSXElement()) {
            const parent = currentPath.parentPath;
            if (parent && parent.isJSXElement()) {
                // Find index in parent's children
                const parentNode = parent.node;
                let index = 0;
                for (let i = 0; i < parentNode.children.length; i++) {
                    const child = parentNode.children[i];
                    if (child === currentPath.node) {
                        index = i;
                        break;
                    }
                }
                pathArray.unshift(index);
            } else if (parent && parent.isReturnStatement()) {
                // At root level
                break;
            }
        } else if (currentPath.isReturnStatement()) {
            // At root level
            break;
        }
        currentPath = currentPath.parentPath;
    }

    return pathArray.length > 0 ? pathArray : [0];
}

/**
 * Find component name from class declaration
 */
function findComponentName(path: NodePath<t.JSXOpeningElement>): string {
    let classPath = path;

    // Find parent class declaration
    while (classPath) {
        if (classPath.isClassDeclaration()) {
            if (classPath.node.id && tModule.isIdentifier(classPath.node.id)) {
                return classPath.node.id.name;
            }
            break;
        }
        classPath = classPath.parentPath;
    }

    return "Component";
}

export default function babelPluginWSXFocus(): PluginObj {
    const t = tModule;
    return {
        name: "babel-plugin-wsx-focus",
        visitor: {
            JSXOpeningElement(path) {
                const element = path.node;

                if (!t.isJSXIdentifier(element.name)) {
                    return;
                }

                const elementName = element.name.name;

                // Check if already has data-wsx-key
                const hasKey = element.attributes.some(
                    (attr) =>
                        t.isJSXAttribute(attr) &&
                        t.isJSXIdentifier(attr.name) &&
                        attr.name.name === "data-wsx-key"
                );

                if (hasKey) {
                    return; // Skip if already has key
                }

                // Extract props
                const props = extractPropsFromJSXAttributes(element.attributes);

                // Check for contenteditable attribute
                const hasContentEditable = element.attributes.some(
                    (attr) =>
                        t.isJSXAttribute(attr) &&
                        t.isJSXIdentifier(attr.name) &&
                        (attr.name.name === "contenteditable" ||
                            attr.name.name === "contentEditable")
                );

                // Check if element is focusable
                if (!isFocusableElement(elementName, hasContentEditable)) {
                    return; // Skip non-focusable elements
                }

                // Get component name
                const componentName = findComponentName(path);

                // Calculate path from root
                const pathArray = calculateJSXPath(path);

                // Generate key
                const key = generateStableKey(elementName, componentName, pathArray, props);

                // Add data-wsx-key attribute
                const keyAttr = t.jsxAttribute(
                    t.jsxIdentifier("data-wsx-key"),
                    t.stringLiteral(key)
                );

                element.attributes.push(keyAttr);
            },
        },
    };
}

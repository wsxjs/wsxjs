/**
 * Dropdown Types
 * 下拉菜单组件的类型定义
 */

export interface DropdownOption {
    /** 选项值 */
    value: string;
    /** 选项标签 */
    label: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义渲染函数 */
    render?: () => HTMLElement;
}

export interface DropdownConfig {
    /** 占位符文本 */
    placeholder?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 下拉菜单位置（top/bottom） */
    position?: "top" | "bottom";
    /** 下拉菜单对齐方式（left/right/center） */
    align?: "left" | "right" | "center";
    /** 触发方式（click/hover） */
    trigger?: "click" | "hover";
}

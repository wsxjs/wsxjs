/**
 * ResponsiveNav Types
 * 响应式导航栏组件的类型定义
 */

export interface NavItem {
    /** 链接文本 */
    label: string;
    /** 链接路径 */
    to: string;
    /** 是否精确匹配 */
    exact?: boolean;
    /** 是否在移动端隐藏 */
    hideOnMobile?: boolean;
}

export interface ResponsiveNavConfig {
    /** 品牌名称 */
    brand?: string;
    /** 品牌图标（可选，可以是字符串或 HTMLElement） */
    brandIcon?: HTMLElement | string;
    /** 导航项列表 */
    items: NavItem[];
    /** 右侧操作项标签名列表（如 ['language-switcher', 'theme-switcher']） */
    actionTags?: string[];
    /** 移动端断点（px） */
    mobileBreakpoint?: number;
    /** 是否自动处理 overflow */
    autoOverflow?: boolean;
}

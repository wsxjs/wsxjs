export interface CodeSegment {
    /** 代码内容 */
    code: string;
    /** 编程语言（用于语法高亮） */
    language: string;
}

export interface CodeBlockConfig {
    /** 代码内容（单个代码块时使用） */
    code?: string;
    /** 代码段数组（多个代码块时使用，优先级高于 code） */
    segments?: CodeSegment[];
    /** 代码标题（可选） */
    title?: string;
    /** 编程语言（用于语法高亮，默认为 'typescript'，仅在单个代码块时使用） */
    language?: string;
    /** 是否显示复制按钮 */
    showCopy?: boolean;
    /** 是否显示"在线体验"按钮 */
    showTryOnline?: boolean;
    /** "在线体验"按钮的 URL（优先级低于 onTryOnline） */
    tryOnlineUrl?: string;
    /** "在线体验"按钮的点击回调（优先级高于 tryOnlineUrl） */
    onTryOnline?: () => void;
}

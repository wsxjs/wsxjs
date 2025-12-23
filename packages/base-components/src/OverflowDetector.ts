/**
 * OverflowDetector
 * 可复用的 overflow 检测工具类
 * 用于检测容器中的子元素是否超出可用空间，并计算哪些元素应该可见/隐藏
 */

export interface OverflowDetectorConfig {
    /** 容器元素 */
    container: HTMLElement;
    /** 子元素列表（按顺序） */
    items: HTMLElement[];
    /** 子元素之间的间距（px） */
    gap?: number;
    /** 容器内其他固定元素占用的宽度（px） */
    reservedWidth?: number;
    /** overflow 按钮的宽度（px，如果存在） */
    overflowButtonWidth?: number;
    /** 容器内边距（px） */
    padding?: number;
    /** 是否至少保留一个可见项 */
    minVisibleItems?: number;
}

export interface OverflowResult {
    /** 可见项的索引数组 */
    visibleIndices: number[];
    /** 隐藏项的索引数组 */
    hiddenIndices: number[];
    /** 是否需要显示 overflow 按钮 */
    needsOverflow: boolean;
}

/**
 * OverflowDetector 类
 * 提供静态方法用于检测和处理 overflow
 */
export class OverflowDetector {
    /**
     * 检测 overflow 并计算可见/隐藏项
     * @param config 配置对象
     * @returns OverflowResult
     */
    static detect(config: OverflowDetectorConfig): OverflowResult {
        const {
            container,
            items,
            gap = 16,
            reservedWidth = 0,
            overflowButtonWidth = 0,
            padding = 0,
            minVisibleItems = 1,
        } = config;

        if (!container || items.length === 0) {
            return {
                visibleIndices: [],
                hiddenIndices: [],
                needsOverflow: false,
            };
        }

        const containerWidth = container.offsetWidth;
        const availableWidth = containerWidth - reservedWidth - padding * 2;

        // 第一步：尝试显示所有项（不考虑 overflow 按钮）
        let totalWidth = 0;
        const allVisibleIndices: number[] = [];
        const allHiddenIndices: number[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item || item.offsetWidth === 0) {
                // 如果元素不存在或宽度为0，先假设可见
                allVisibleIndices.push(i);
                continue;
            }

            const itemWidth = item.offsetWidth + (i > 0 ? gap : 0);
            if (totalWidth + itemWidth <= availableWidth) {
                totalWidth += itemWidth;
                allVisibleIndices.push(i);
            } else {
                allHiddenIndices.push(i);
            }
        }

        // 如果所有项都能显示，不需要 overflow
        if (allHiddenIndices.length === 0) {
            return {
                visibleIndices: allVisibleIndices,
                hiddenIndices: [],
                needsOverflow: false,
            };
        }

        // 第二步：如果有隐藏项，需要显示 overflow 按钮
        // 重新计算可用宽度（减去 overflow 按钮宽度）
        const availableWidthWithOverflow = availableWidth - overflowButtonWidth - gap;

        // 第三步：最大化可见项数量
        totalWidth = 0;
        const visibleIndices: number[] = [];
        const hiddenIndices: number[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item || item.offsetWidth === 0) {
                // 如果元素不存在或宽度为0，先假设可见
                if (visibleIndices.length < minVisibleItems) {
                    visibleIndices.push(i);
                } else {
                    hiddenIndices.push(i);
                }
                continue;
            }

            const itemWidth = item.offsetWidth + (visibleIndices.length > 0 ? gap : 0);
            if (totalWidth + itemWidth <= availableWidthWithOverflow) {
                totalWidth += itemWidth;
                visibleIndices.push(i);
            } else {
                hiddenIndices.push(i);
            }
        }

        // 确保至少显示 minVisibleItems 个项
        if (visibleIndices.length < minVisibleItems && items.length > 0) {
            // 从隐藏项中取出前几个，强制显示
            const needed = minVisibleItems - visibleIndices.length;
            const toShow = hiddenIndices.splice(0, needed);
            visibleIndices.push(...toShow);
            visibleIndices.sort((a, b) => a - b);
        }

        return {
            visibleIndices,
            hiddenIndices,
            needsOverflow: hiddenIndices.length > 0,
        };
    }

    /**
     * 批量计算多个元素的宽度（包括间距）
     * @param items 元素数组
     * @param gap 元素间距
     * @returns 总宽度
     */
    static calculateTotalWidth(items: HTMLElement[], gap: number = 16): number {
        if (items.length === 0) return 0;
        return items.reduce((sum, item, index) => {
            const itemWidth = item.offsetWidth || 0;
            return sum + itemWidth + (index > 0 ? gap : 0);
        }, 0);
    }

    /**
     * 获取元素的实际宽度（包括 margin）
     * @param element 元素
     * @returns 总宽度（包括 margin）
     */
    static getElementTotalWidth(element: HTMLElement): number {
        if (!element) return 0;
        const style = window.getComputedStyle(element);
        const width = element.offsetWidth;
        const marginLeft = parseFloat(style.marginLeft) || 0;
        const marginRight = parseFloat(style.marginRight) || 0;
        return width + marginLeft + marginRight;
    }
}

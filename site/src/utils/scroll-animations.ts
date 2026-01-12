/**
 * 滚动动画工具 - UI/UX PRO MAX
 * 使用 Intersection Observer API 实现滚动触发的渐入动画
 */

/**
 * 初始化滚动动画
 * 为带有特定 class 的元素添加滚动触发的渐入效果
 */
export function initScrollAnimations(): void {
    // 检查浏览器是否支持 Intersection Observer
    if (!("IntersectionObserver" in window)) {
        // 如果不支持，直接显示所有元素
        document
            .querySelectorAll(
                ".scroll-fade-in, .scroll-fade-in-left, .scroll-fade-in-right, .scroll-scale-in"
            )
            .forEach((el) => {
                el.classList.add("visible");
            });
        return;
    }

    // 创建 Intersection Observer
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    // 动画完成后可以取消观察（可选）
                    // observer.unobserve(entry.target);
                }
            });
        },
        {
            // 当元素进入视口 10% 时触发
            threshold: 0.1,
            // 提前 50px 触发（更早开始动画）
            rootMargin: "0px 0px -50px 0px",
        }
    );

    // 观察所有需要动画的元素
    const animatedElements = document.querySelectorAll(
        ".scroll-fade-in, .scroll-fade-in-left, .scroll-fade-in-right, .scroll-scale-in"
    );

    animatedElements.forEach((el) => {
        observer.observe(el);
    });
}

/**
 * 为元素添加滚动动画类
 * @param element - 要添加动画的元素
 * @param animationType - 动画类型：'fade-in' | 'fade-in-left' | 'fade-in-right' | 'scale-in'
 */
export function addScrollAnimation(
    element: HTMLElement,
    animationType: "fade-in" | "fade-in-left" | "fade-in-right" | "scale-in" = "fade-in"
): void {
    const classMap = {
        "fade-in": "scroll-fade-in",
        "fade-in-left": "scroll-fade-in-left",
        "fade-in-right": "scroll-fade-in-right",
        "scale-in": "scroll-scale-in",
    };

    element.classList.add(classMap[animationType]);
}

/**
 * 导航栏滚动效果
 * 当页面滚动时，为导航栏添加阴影和背景变化
 */
export function initNavScrollEffect(): void {
    const nav = document.querySelector(".main-nav") as HTMLElement;
    if (!nav) return;

    const handleScroll = (): void => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 50) {
            nav.classList.add("nav-scrolled");
        } else {
            nav.classList.remove("nav-scrolled");
        }
    };

    // 使用节流优化性能
    let ticking = false;
    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    // 初始检查
    handleScroll();
}

/**
 * 平滑滚动到元素
 * @param target - 目标元素或选择器
 * @param offset - 偏移量（默认导航栏高度）
 */
export function smoothScrollTo(target: HTMLElement | string, offset: number = 70): void {
    const element = typeof target === "string" ? document.querySelector(target) : target;
    if (!element) return;

    const elementPosition = (element as HTMLElement).getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
    });
}

/**
 * 初始化所有滚动相关功能
 */
export function initAllScrollEffects(): void {
    initScrollAnimations();
    initNavScrollEffect();
}

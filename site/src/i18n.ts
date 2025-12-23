/**
 * i18next 初始化配置
 */
import { initI18n, i18nInstance } from "@wsxjs/wsx-i18next";

export const i18n = initI18n({
    fallbackLng: "en",
    debug: false,
    backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    ns: [
        "home",
        "common",
        "examples",
        "features",
        "quickstart",
        "webcomponent",
        "lightcomponent",
        "slots",
        "privacy",
        "terms",
    ],
    defaultNS: "common",
});

// 重新导出 i18n 实例，方便在其他地方使用
export { i18nInstance };

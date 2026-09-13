export const LANGUAGES = {
    en: 'English',
    'pt-br': 'Português (Brasil)',
    es: 'español',
    fr: 'Français',
    de: 'Deutsch',
    ja: '日本語',
    'en-in': 'English (India)',
    hi: 'हिन्दी',
    ko: '한국어',
    id: 'Bahasa Indonesia',
    vn: 'Tiếng Việt',
    uk: 'Українська',
    ru: 'Русский',
    'zh-CN': '简体中文'
};
export const LANGUAGES_CODE = {
    en: 'en-US',
    'pt-br': 'pt-BR',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    ja: 'ja-JP',
    'en-in': 'en-IN',
    hi: 'hi-IN',
    ko: 'ko-KR',
    id: 'id-ID',
    vn: 'vi-VN',
    uk: 'uk-UA',
    ru: 'ru-RU',
    'zh-CN': 'zh-CN'
};

const locals = Object.keys(LANGUAGES);

export const CONFIG = {
    // 实际部署域名（canonical / og:url / hreflang / llms 全部由这里驱动）
    // pic-tool.fun 未注册，务必与实际访问域名保持一致
    website: 'https://pic.nxzai.cc.cd',
    locals
}

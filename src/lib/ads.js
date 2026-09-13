/**
 * 广告中心配置 —— 环境变量 → 运行期常量的唯一入口
 *
 * 设计目标：Layout.astro（注入 head 脚本）与 AdSlot.jsx（渲染广告位）
 * 共用这一份解析逻辑，避免两处判断标准跑偏导致「脚本加载了但没广告位」
 * 或「广告位渲染了但没脚本」这类错位问题。
 *
 * 支持的广告源：
 *   - google  Google AdSense（本文件主支持的方案）
 *   - baidu   百度联盟 H5（原有方案，保留兼容）
 *   - none    完全关闭（默认）
 *
 * 注意：Astro 的 import.meta.env 只在「构建时」内联 PUBLIC_* 变量，
 * 改完环境变量必须重新构建部署才会生效。
 */

const str = (v) => (v || '').trim();
const raw = (v) => str(v).toLowerCase();

// ---------- 百度联盟（旧方案，保留兼容）----------
export const BAIDU_ON = import.meta.env.PUBLIC_ENABLE_ADS === 'true';
export const BAIDU_PID = str(import.meta.env.PUBLIC_Baidu_Pid);
export const AD_WIDTH = parseInt(import.meta.env.PUBLIC_Baidu_AdsWidth || '750', 10);
export const AD_HEIGHT = parseInt(import.meta.env.PUBLIC_Baidu_AdsHeight || '90', 10);

// ---------- Google AdSense ----------
/** ca-pub-xxxxxxxxxxxxxxxx（AdSense 后台 → 账号 → 发布商 ID） */
export const GOOGLE_ADS_CLIENT = str(import.meta.env.PUBLIC_GOOGLE_ADS_CLIENT);
/** 是否开启 AdSense 测试模式：不消耗真实展示、页面上会标注「测试广告」 */
export const GOOGLE_TEST = import.meta.env.PUBLIC_GOOGLE_ADS_TEST === 'true';
/** 手动广告单元位 ID（AdSense 后台 → 广告 → 按广告单元 → 新建展示广告 → 拿到 data-ad-slot） */
export const GOOGLE_SLOT_DEFAULT = str(import.meta.env.PUBLIC_GOOGLE_AD_SLOT);
export const GOOGLE_SLOT_INTERSTITIAL = str(import.meta.env.PUBLIC_GOOGLE_AD_SLOT_INTERSTITIAL);
export const GOOGLE_SLOT_INFEED = str(import.meta.env.PUBLIC_GOOGLE_AD_SLOT_INFEED);
/** 手动广告单元的版式，默认 auto（AdSense 自选响应式） */
export const GOOGLE_AD_FORMAT = str(import.meta.env.PUBLIC_GOOGLE_AD_FORMAT) || 'auto';

// ---------- 位点开关 ----------
export const INTERSTITIAL_ON = import.meta.env.PUBLIC_ENABLE_INTERSTITIALS === 'true';
export const INFEED_ON = import.meta.env.PUBLIC_ENABLE_INFEED === 'true';

// ---------- 广告源解析 ----------
const OFF_VALUES = ['none', 'off', 'false', '0', 'no'];

function baiduReady() {
    return BAIDU_ON && !!BAIDU_PID;
}

function googleReady() {
    return !!GOOGLE_ADS_CLIENT;
}

function resolveProvider() {
    const explicit = raw(import.meta.env.PUBLIC_ADS_PROVIDER);
    if (explicit) {
        if (OFF_VALUES.includes(explicit)) return 'none';
        if (explicit === 'google') return googleReady() ? 'google' : 'none';
        if (explicit === 'baidu') return baiduReady() ? 'baidu' : 'none';
    }
    // 未显式指定时自动推断：配了 AdSense 客户端就用 Google，否则退回百度
    if (googleReady()) return 'google';
    if (baiduReady()) return 'baidu';
    return 'none';
}

export const ADS_PROVIDER = resolveProvider();

/**
 * 某个位点是否应该渲染。
 * banner 默认随总开关，interstitial / infeed 需各自独立开启。
 */
export function slotEnabled(variant) {
    if (ADS_PROVIDER === 'none') return false;
    if (variant === 'interstitial') return INTERSTITIAL_ON;
    if (variant === 'infeed') return INFEED_ON;
    return true; // banner
}

/** Google 手动广告单元：取该位点的专用 slot，没有则退回通用 slot */
export function googleSlotFor(variant) {
    if (variant === 'interstitial') return GOOGLE_SLOT_INTERSTITIAL || GOOGLE_SLOT_DEFAULT;
    if (variant === 'infeed') return GOOGLE_SLOT_INFEED || GOOGLE_SLOT_DEFAULT;
    return GOOGLE_SLOT_DEFAULT;
}

/**
 * 该位点最终是否真的能出广告。
 * 注意区别：
 *   head 里的 adsbygoogle.js —— 只认 GOOGLE_ADS_CLIENT，配了就该注入（Auto Ads 靠它）
 *   AdSlot 里的 <ins>      —— 还必须要有 data-ad-slot 才能出「手动广告单元」
 */
export function googleInsSlotFor(variant) {
    const slot = googleSlotFor(variant);
    return slotEnabled(variant) ? slot : '';
}

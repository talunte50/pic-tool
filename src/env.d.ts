/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />


interface Window {
    dataLayer: any[]
    // 百度联盟 dsp.js 注入的全局对象
    dsp: any
    // Google AdSense adsbygoogle.js 注入的全局队列
    adsbygoogle: any
}

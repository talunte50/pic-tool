import { useEffect, useRef } from 'react';
import {
    ADS_PROVIDER,
    AD_WIDTH,
    AD_HEIGHT,
    BAIDU_PID,
    GOOGLE_ADS_CLIENT,
    GOOGLE_AD_FORMAT,
    GOOGLE_TEST,
    googleInsSlotFor,
    slotEnabled,
} from '@lib/ads';

/**
 * AdSlot — 多广告源广告位（环境变量控制）
 *
 * 广告源选择：
 *   PUBLIC_ADS_PROVIDER = google | baidu | none（留空则自动推断）
 *
 * Google AdSense：
 *   PUBLIC_GOOGLE_ADS_CLIENT        ca-pub-xxxxxxxx（必填，head 脚本由此注入）
 *   PUBLIC_GOOGLE_AD_SLOT           手动广告单元 ID（banner 位 + 其余位点的兜底）
 *   PUBLIC_GOOGLE_AD_SLOT_INTERSTITIAL / _INFEED   各站点专用 ID（可选）
 *   PUBLIC_GOOGLE_AD_FORMAT         版式，默认 auto
 *   PUBLIC_GOOGLE_ADS_TEST=true     测试模式，不产生无效流量
 *
 * 百度联盟（旧方案，保留）：
 *   PUBLIC_ENABLE_ADS / PUBLIC_Baidu_Pid / PUBLIC_Baidu_AdsWidth / PUBLIC_Baidu_AdsHeight
 *
 * 位点：banner（页面顶/底，默认开）/ interstitial（需 PUBLIC_ENABLE_INTERSTITIALS）/ infeed（需 PUBLIC_ENABLE_INFEED）
 *
 * 工程要点：
 *  - 第三方脚本（dsp.js / adsbygoogle.js）都用 module 级 Promise 去重，多实例只加载一次；
 *  - 百度：每个实例创建独立 div 容器交给 dsp.Ads(cfg, host) 渲染，避免 host 冲突；
 *  - Google：<ins> 渲染完成后调用一次 adsbygoogle.push({})，用 pushedRef 幂等守卫，
 *    避免 React 重渲染导致重复 push（会抛 "already have ads in them"）；
 *  - 未配置广告单元 ID 时组件直接返回 null，不留空白占位框。
 */

// ---------- 百度 dsp.js 去重加载 ----------
let dspPromise = null;
function loadDsp() {
    if (window.dsp) return Promise.resolve(window.dsp);
    if (dspPromise) return dspPromise;
    dspPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://www.baidu.com/dsp/js/libs/dsp.js';
        s.async = true;
        s.onload = () => resolve(window.dsp);
        s.onerror = () => {
            dspPromise = null; // 失败允许下次重试
            reject(new Error('dsp.js load failed'));
        };
        document.head.appendChild(s);
    });
    return dspPromise;
}

// ---------- Google adsbygoogle.js 去重加载 ----------
let googlePromise = null;
function loadGoogleAds() {
    // adsbygoogle 在脚本加载完成后是一个数组（AdSense 的 command queue）
    if (Array.isArray(window.adsbygoogle)) return Promise.resolve(window.adsbygoogle);
    if (googlePromise) return googlePromise;
    googlePromise = new Promise((resolve, reject) => {
        const deadline = Date.now() + 8000;
        const tick = () => {
            if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
                return resolve(window.adsbygoogle);
            }
            if (Date.now() > deadline) {
                googlePromise = null;
                return reject(new Error('adsbygoogle.js not ready'));
            }
            setTimeout(tick, 120);
        };
        tick();
    });
    return googlePromise;
}

// ---------- 百度广告位 ----------
function BaiduSlot({ variant }) {
    const hostRef = useRef(null);
    useEffect(() => {
        let mounted = true;
        loadDsp()
            .then((dsp) => {
                if (!mounted || !hostRef.current) return;
                if (dsp && dsp.Ads) {
                    new dsp.Ads({ p: BAIDU_PID, w: AD_WIDTH, h: AD_HEIGHT, s: 1, t: 10 }).init(hostRef.current);
                }
            })
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, []);

    const style =
        variant === 'interstitial'
            ? { width: AD_WIDTH, height: AD_HEIGHT, margin: '12px auto', overflow: 'hidden', background: '#fafafa' }
            : variant === 'infeed'
            ? { width: AD_WIDTH, height: AD_HEIGHT, margin: '8px auto', overflow: 'hidden', opacity: 0.9 }
            : { width: AD_WIDTH, height: AD_HEIGHT, margin: '16px auto', overflow: 'hidden' };

    return <div ref={hostRef} style={style} aria-hidden="true" />;
}

// ---------- Google AdSense 广告位 ----------
function GoogleSlot({ variant, slot }) {
    const insRef = useRef(null);
    const pushedRef = useRef(false);

    useEffect(() => {
        if (!insRef.current || pushedRef.current) return;
        loadGoogleAds()
            .then((adsbygoogle) => {
                if (pushedRef.current || !insRef.current) return;
                pushedRef.current = true;
                try {
                    // 每个 <ins> 对应一次 push，AdSense 会回填 iframe。
                    // 重复 push 会抛 "All ins elements in the DOM with class=adsbygoogle already have ads in them"，
                    // 因此用 pushedRef 严格保证一个 <ins> 实例只 push 一次。
                    adsbygoogle.push({});
                } catch (e) {
                    /* 忽略 AdSense 的非致命报错，不能让它中断页面 */
                }
            })
            .catch(() => {});
    }, [slot]);

    return (
        <div
            className="w-full overflow-hidden text-center"
            style={{
                margin: variant === 'interstitial' ? '12px auto' : variant === 'infeed' ? '8px auto' : '16px auto',
            }}
        >
            <ins
                ref={insRef}
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={GOOGLE_ADS_CLIENT}
                data-ad-slot={slot}
                data-ad-format={GOOGLE_AD_FORMAT}
                data-full-width-responsive="true"
                {...(GOOGLE_TEST ? { 'data-ad-test': 'on' } : {})}
            />
        </div>
    );
}

export default function AdSlot({ variant = 'banner' }) {
    if (ADS_PROVIDER === 'none') return null;
    if (!slotEnabled(variant)) return null;

    if (ADS_PROVIDER === 'google') {
        const slot = googleInsSlotFor(variant);
        if (!slot) return null; // 没配广告单元 ID 就不占位，避免出现空白框
        return <GoogleSlot variant={variant} slot={slot} />;
    }

    return <BaiduSlot variant={variant} />;
}

import { useEffect, useState, useRef } from 'react';

/**
 * AdSlot — 百度联盟 H5 广告位矩阵（环境变量控制）
 *
 * 总开关 / 尺寸（部署时注入）：
 *   PUBLIC_ENABLE_ADS      — 'true' / 'false'，总开关
 *   PUBLIC_Baidu_Pid       — 百度联盟渠道 ID（_huf.p）
 *   PUBLIC_Baidu_AdsWidth  — 广告位宽（像素）
 *   PUBLIC_Baidu_AdsHeight — 广告位高（像素）
 *
 * 位点矩阵（每个位点独立开关，默认 banner）：
 *   variant='banner'       横幅位（默认，用于页面顶部/底部）
 *   variant='interstitial' 结果完成后的插层位（需 PUBLIC_ENABLE_INTERSTITIALS='true'）
 *   variant='infeed'       原生信息流位（需 PUBLIC_ENABLE_INFEED='true'）
 *
 * 未开启 / 未配置 Pid 时渲染 null，不影响任何功能。
 *
 * 工程要点：
 *  - dsp.js 用 module 级 Promise 去重，多实例只加载一次；
 *  - 每个实例创建独立 div 容器并交给 dsp.Ads(cfg, host) 渲染，避免 host 冲突；
 *  - 卸载时移除容器与脚本监听，防止泄漏。
 */
const enableAds = import.meta.env.PUBLIC_ENABLE_ADS === 'true';
const pid = import.meta.env.PUBLIC_Baidu_Pid || '';
const adWidth = parseInt(import.meta.env.PUBLIC_Baidu_AdsWidth || '750', 10);
const adHeight = parseInt(import.meta.env.PUBLIC_Baidu_AdsHeight || '90', 10);

// 位点独立开关
const INTERSTITIAL_ON = import.meta.env.PUBLIC_ENABLE_INTERSTITIALS === 'true';
const INFEED_ON = import.meta.env.PUBLIC_ENABLE_INFEED === 'true';

// dsp.js 去重加载（模块级）
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

export default function AdSlot({ variant = 'banner' }) {
    const hostRef = useRef(null);
    const [ready, setReady] = useState(false);

    const variantEnabled =
        variant === 'banner' ? true : variant === 'interstitial' ? INTERSTITIAL_ON : INFEED_ON;
    const active = enableAds && !!pid && variantEnabled;

    useEffect(() => {
        if (!active) return;
        let mounted = true;
        loadDsp()
            .then((dsp) => {
                if (!mounted || !hostRef.current) return;
                const cfg = { p: pid, w: adWidth, h: adHeight, s: 1, t: 10 };
                if (dsp && dsp.Ads) {
                    new dsp.Ads(cfg).init(hostRef.current);
                    setReady(true);
                }
            })
            .catch(() => {});
        return () => {
            mounted = false;
        };
    }, [active, variant]);

    if (!active) return null;

    const style =
        variant === 'interstitial'
            ? { width: adWidth, height: adHeight, margin: '12px auto', overflow: 'hidden', background: '#fafafa' }
            : variant === 'infeed'
            ? { width: adWidth, height: adHeight, margin: '8px auto', overflow: 'hidden', opacity: 0.9 }
            : { width: adWidth, height: adHeight, margin: '16px auto', overflow: 'hidden' };

    return <div ref={hostRef} style={style} aria-hidden={!ready} />;
}

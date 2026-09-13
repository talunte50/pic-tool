import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ColorPicker, Button, message, Spin, Modal, Slider } from 'antd';
import {
    env,
    AutoModel,
    AutoProcessor,
    RawImage,
} from '@huggingface/transformers';
import { Icon } from './Icons';
import { DownBtn } from './DownBtn';
import { UploadDragger } from './UploadDragger';
import { cn, fileToDataURL, url2Blob, canvas2Blob, copyAsBlob, toDownloadFile, computedSize } from '../lib/utils';
import useKeyboardShortcuts from '../lib/useKeyboardShortcuts';
import usePaste from '../lib/usePaste';

const REMOVE_BACKGROUND_STATUS = {
    LOADING: 0,
    NO_SUPPORT_WEBGPU: 1,
    LOAD_ERROR: 2,
    LOAD_SUCCESS: 3,
    PROCESSING: 4,
    PROCESSING_SUCCESS: 5,
};

// 可配置：通过环境变量切回 ModNet
const MODEL_ID = import.meta.env.PUBLIC_REMOVE_BG_MODEL || 'Xenova/modnet';

const loadImageFromUrl = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
    });

// 背景预设（纯色 + 渐变）
const BG_PRESETS = [
    { key: 'transparent', label: '🔲', value: 'rgba(255,255,255,0)', bg: 'repeating-conic-gradient(#d1d5db 0% 25%, #fff 0% 50%) 50% / 8px 8px' },
    { key: 'white', label: '⬜', value: '#ffffff', bg: '#ffffff' },
    { key: 'black', label: '⬛', value: '#000000', bg: '#000000' },
    { key: 'skyblue', label: '🩵', value: '#87ceeb', bg: '#87ceeb' },
    { key: 'pink', label: '🩷', value: '#ffb7c5', bg: '#ffb7c5' },
    {
        key: 'gradient',
        label: '🌈',
        value: 'linear-gradient(140deg, #a18cd1 25%, #fbc2eb 90%)',
        bg: 'linear-gradient(140deg, #a18cd1 25%, #fbc2eb 90%)',
    },
    {
        key: 'ocean',
        label: '🌊',
        value: 'linear-gradient(140deg, #4facfe 25%, #00f2fe 90%)',
        bg: 'linear-gradient(140deg, #4facfe 25%, #00f2fe 90%)',
    },
];

export default function Remover({ variant = 'remove' }) {
    const isBlurMode = variant === 'blur';
    const [messageApi, contextHolder] = message.useMessage();
    const canvasRef = useRef(null);
    // 精修画布（透明抠图叠加在上面，画笔改 alpha）
    const editCanvasRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [bgColor, setBgColor] = useState('rgba(255,255,255, 0)');
    const [activePreset, setActivePreset] = useState('transparent');
    const [photoUrl, setPhotoUrl] = useState('');
    const [transparentUrl, setTransparentUrl] = useState('');
    const [photoData, setPhotoData] = useState('');
    const [originalDataUrl, setOriginalDataUrl] = useState('');
    const [cutoutDataUrl, setCutoutDataUrl] = useState('');
    const [blurRadius, setBlurRadius] = useState(18);
    const [isGrid, setIsGrid] = useState(false);
    const [showOrigin, setShowOrigin] = useState(false);
    const [removeBgStatus, setRemoveBgStatus] = useState();
    const [isEditing, setIsEditing] = useState(false); // 精修模式
    const [brushSize, setBrushSize] = useState(20);
    const [brushMode, setBrushMode] = useState('erase'); // 'erase' | 'restore'

    const modelRef = useRef(null);
    const processorRef = useRef(null);
    // 存储蒙版像素数据，用于精修
    const maskRef = useRef(null);
    const originalImgRef = useRef(null);

    useEffect(() => {
        const loadModel = async () => {
            try {
                if (removeBgStatus === REMOVE_BACKGROUND_STATUS.LOADING) return;
                setRemoveBgStatus(REMOVE_BACKGROUND_STATUS.LOADING);
                if (!navigator?.gpu) {
                    setRemoveBgStatus(REMOVE_BACKGROUND_STATUS.NO_SUPPORT_WEBGPU);
                    Modal.warning({
                        title: 'WebGPU is not supported',
                        content: <>WebGPU is not supported in this browser, to use the image segmentation function, please use the latest version of Google Chrome.</>,
                    });
                    return;
                }

                if (env.backends.onnx.wasm) {
                    env.backends.onnx.wasm.proxy = false;
                }
                modelRef.current = await AutoModel.from_pretrained(MODEL_ID, { device: 'webgpu', quantized: false });
                processorRef.current = await AutoProcessor.from_pretrained(MODEL_ID);
                setRemoveBgStatus(REMOVE_BACKGROUND_STATUS.LOAD_SUCCESS);
            } catch (error) {
                setRemoveBgStatus(REMOVE_BACKGROUND_STATUS.LOAD_ERROR);
                messageApi.error({
                    content: 'Failed to load model, please try again later!',
                    onClick: () => loadModel(),
                });
                console.error('Failed to load model:', error);
            }
        };
        loadModel();
    }, []);

    usePaste(async (file) => {
        if (removeBgStatus === REMOVE_BACKGROUND_STATUS.LOADING)
            return messageApi.info('"Remove background function loading!');
        if (removeBgStatus === REMOVE_BACKGROUND_STATUS.NO_SUPPORT_WEBGPU)
            return messageApi.info('WebGPU is not supported in this browser, to use the image segmentation function, please use the latest version of Google Chrome.');
        if (loading) return messageApi.info('Working hard, please wait!');
        fileToDataURL(file)
            .then((img) => {
                setPhotoData(img);
                setOriginalDataUrl(img.src);
                setCutoutDataUrl('');
                setTransparentUrl('');
                setIsEditing(false);
                const imgbase64 = toDraw(img);
                setPhotoUrl(imgbase64);
            })
            .catch((error) => console.error(error));
    }, [loading]);

    useKeyboardShortcuts(
        () => toDownload(),
        () => toCopy(),
        [photoData, transparentUrl, cutoutDataUrl, bgColor, activePreset, isEditing, blurRadius, loading],
    );

    const imageSize = useMemo(() => computedSize(photoData.width, photoData.height), [photoData]);

    useEffect(() => {
        const processImage = async () => {
            const model = modelRef.current;
            const processor = processorRef.current;
            if (!model || !processor || !photoUrl) return;
            setLoading(true);
            setRemoveBgStatus(REMOVE_BACKGROUND_STATUS.PROCESSING);
            setIsEditing(false);
            try {
                const img = await RawImage.fromURL(photoUrl);
                const { pixel_values } = await processor(img);
                const { output } = await model({ input: pixel_values });
                const maskData = (
                    await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(img.width, img.height)
                ).data;

                const cutoutCanvas = document.createElement('canvas');
                cutoutCanvas.width = img.width;
                cutoutCanvas.height = img.height;
                const cutoutCtx = cutoutCanvas.getContext('2d');
                cutoutCtx.drawImage(img.toCanvas(), 0, 0);
                const pixelData = cutoutCtx.getImageData(0, 0, img.width, img.height);
                for (let i = 0; i < maskData.length; ++i) {
                    pixelData.data[4 * i + 3] = maskData[i];
                }
                cutoutCtx.putImageData(pixelData, 0, 0);
                const cutoutUrl = cutoutCanvas.toDataURL('image/png');
                setCutoutDataUrl(cutoutUrl);
                setTransparentUrl(cutoutUrl);
                // 存蒙版备用（精修）
                maskRef.current = maskData;
                originalImgRef.current = img.toCanvas();

                if (isBlurMode) {
                    const resultUrl = await composeBlurredBackground(photoUrl, cutoutUrl, blurRadius);
                    setTransparentUrl(resultUrl);
                    const imgFile = await url2Blob(resultUrl);
                    const image = await fileToDataURL(imgFile);
                    setPhotoData(image);
                } else {
                    const imgFile = await canvas2Blob(cutoutCanvas);
                    const image = await fileToDataURL(imgFile);
                    setPhotoData(image);
                }
            } catch (e) {
                console.error(e);
                messageApi.error('Background removal failed, please retry.');
            } finally {
                setLoading(false);
                setRemoveBgStatus(REMOVE_BACKGROUND_STATUS.PROCESSING_SUCCESS);
            }
        };
        processImage();
    }, [photoUrl]);

    useEffect(() => {
        const redrawBlurredImage = async () => {
            if (!isBlurMode || !originalDataUrl || !cutoutDataUrl || loading) return;
            setLoading(true);
            try {
                const resultUrl = await composeBlurredBackground(originalDataUrl, cutoutDataUrl, blurRadius);
                setTransparentUrl(resultUrl);
                const imgFile = await url2Blob(resultUrl);
                const image = await fileToDataURL(imgFile);
                setPhotoData(image);
            } catch (error) {
                messageApi.error('Failed to update blur background.');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        redrawBlurredImage();
    }, [blurRadius]);

    const beforeUpload = async (file) => {
        const img = await fileToDataURL(file);
        setPhotoData(img);
        setOriginalDataUrl(img.src);
        setCutoutDataUrl('');
        setTransparentUrl('');
        setIsEditing(false);
        const imgbase64 = toDraw(img);
        setPhotoUrl(imgbase64);
        return Promise.reject();
    };

    const composeBlurredBackground = async (originUrl, cutoutUrl, radius) => {
        const [origin, cutout] = await Promise.all([loadImageFromUrl(originUrl), loadImageFromUrl(cutoutUrl)]);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = origin.width;
        canvas.height = origin.height;
        const bleed = Math.max(12, radius * 2);
        ctx.save();
        ctx.filter = `blur(${radius}px)`;
        ctx.drawImage(origin, -bleed, -bleed, origin.width + bleed * 2, origin.height + bleed * 2);
        ctx.restore();
        ctx.drawImage(cutout, 0, 0, origin.width, origin.height);
        return canvas.toDataURL('image/png');
    };

    const toDraw = (image, bgColor) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { width, height } = image;
        canvas.width = width;
        canvas.height = height;
        if (bgColor) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(image, 0, 0, width, height);
        return canvas.toDataURL('image/png');
    };

    const onBgChange = (e) => {
        if (!e) {
            setBgColor('rgba(255,255,255, 0)');
            setActivePreset('transparent');
            return;
        }
        const color = e.toRgbString();
        setBgColor(color);
        setActivePreset('custom');
    };

    const applyPreset = (preset) => {
        setActivePreset(preset.key);
        if (preset.key === 'transparent') {
            setBgColor('rgba(255,255,255, 0)');
        } else {
            setBgColor(preset.value);
        }
    };

    // ========== 精修画笔 ==========
    const enterEdit = () => {
        if (!cutoutDataUrl || !maskRef.current) return;
        setIsEditing(true);
    };

    // 画布进入 DOM 后初始化（解决 enterEdit 时 ref 尚未渲染的时序问题）
    useEffect(() => {
        if (!isEditing || !cutoutDataUrl) return;
        initEditCanvas();
    }, [isEditing, cutoutDataUrl]);

    const initEditCanvas = () => {
        const canvas = editCanvasRef.current;
        if (!canvas || !cutoutDataUrl) return;
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = cutoutDataUrl;
    };

    const isPointerDown = useRef(false);
    // 精修后的最新结果（同步 ref，避免 state 闭包旧值竞态）
    const editCutoutRef = useRef(null);

    const applyBrush = useCallback(
        (e, mode) => {
            const canvas = editCanvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            const r = brushSize * scaleX;

            ctx.save();
            if (mode === 'erase') {
                // 擦除：把 alpha 设 0
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,0,1)';
                ctx.fill();
            } else {
                // 恢复：把原图对应区域画回来（需要 mask）
                ctx.globalCompositeOperation = 'source-over';
                if (originalImgRef.current) {
                    const w = canvas.width;
                    const h = canvas.height;
                    const mask = maskRef.current;
                    // 与画布边缘相交裁剪，避免负坐标 / 越界导致 getImageData 抛异常
                    const cx0 = Math.max(0, Math.floor(x - r));
                    const cy0 = Math.max(0, Math.floor(y - r));
                    const cx1 = Math.min(w, Math.ceil(x + r));
                    const cy1 = Math.min(h, Math.ceil(y + r));
                    const cw = cx1 - cx0;
                    const ch = cy1 - cy0;
                    if (cw > 0 && ch > 0) {
                        // 把原图（同坐标系）对应区域画回：source = dest = (cx0,cy0,cw,ch)
                        // 原图本身与画布同尺寸，越界部分不会超出原图
                        ctx.drawImage(originalImgRef.current, cx0, cy0, cw, ch, cx0, cy0, cw, ch);
                        if (mask) {
                            const id = ctx.getImageData(cx0, cy0, cw, ch);
                            for (let i = 0; i < id.data.length; i += 4) {
                                const px = cx0 + (i / 4) % cw;
                                const py = cy0 + Math.floor(i / 4 / cw);
                                const idx = py * w + px;
                                if (idx >= 0 && idx < mask.length) {
                                    id.data[i + 3] = mask[idx];
                                }
                            }
                            ctx.putImageData(id, cx0, cy0);
                        }
                    }
                }
            }
            ctx.restore();
        },
        [brushSize, brushMode],
    );

    const onEditPointerDown = (e) => {
        isPointerDown.current = true;
        applyBrush(e, brushMode);
    };
    const onEditPointerMove = (e) => {
        if (!isPointerDown.current) return;
        applyBrush(e, brushMode);
    };
    const onEditPointerUp = () => {
        isPointerDown.current = false;
        // 导出编辑后的 canvas（同步更新预览，不阻塞 pointer 事件）
        const canvas = editCanvasRef.current;
        if (canvas) {
            const editedUrl = canvas.toDataURL('image/png');
            editCutoutRef.current = editedUrl;
            setTransparentUrl(editedUrl);
            setCutoutDataUrl(editedUrl);
        }
    };

    const exitEdit = () => {
        setIsEditing(false);
        // 退出精修时同步 photoData，让 toDraw 导出精修后的结果（用 ref 避免竞态）
        const latest = editCutoutRef.current || cutoutDataUrl;
        if (latest) {
            url2Blob(latest)
                .then((blob) => fileToDataURL(new File([blob], 'edited.png', { type: 'image/png' })))
                .then((img) => setPhotoData(img))
                .catch(() => {});
        }
        editCutoutRef.current = null;
    };

    // 合成最终导出结果：精修优先，且与预览一致（非透明时填充背景色）
    const composeExportUrl = () => {
        // 精修模式：用编辑后的 URL 结果
        if (isEditing) {
            const latest = editCutoutRef.current || cutoutDataUrl;
            if (!latest) return '';
            const transparentPreset = activePreset === 'transparent' || !bgColor;
            if (transparentPreset) return Promise.resolve(latest);
            return loadImageFromUrl(latest).then((img) => {
                const c = document.createElement('canvas');
                c.width = img.width; c.height = img.height;
                const ctx = c.getContext('2d');
                ctx.fillStyle = bgColor; ctx.fillRect(0, 0, c.width, c.height);
                ctx.drawImage(img, 0, 0);
                return c.toDataURL('image/png');
            });
        }
        // 非精修：用抠图结果（photoData）合成背景色，与预览一致
        if (photoData) {
            const out = toDraw(photoData, bgColor);
            return Promise.resolve(out);
        }
        return Promise.resolve(transparentUrl);
    };

    const toDownload = () => {
        if (loading) return messageApi.info('Working hard, please wait!');
        composeExportUrl().then((u) => {
            if (!u) return;
            toDownloadFile(u, 'pic-tool.png');
            messageApi.success('Download Success!');
        });
    };

    const toCopy = () => {
        if (loading) return messageApi.info('Working hard, please wait!');
        setLoading(true);
        composeExportUrl().then((value) => {
            if (!value) { setLoading(false); return; }
            url2Blob(value)
                .then((blob) => {
                    copyAsBlob(blob)
                        .then(() => messageApi.success('Copied Success!'))
                        .catch(() => messageApi.error('Copy Failed!'));
                })
                .catch(() => messageApi.error('Copy Failed!'))
                .finally(() => setLoading(false));
        });
    };

    const toRefresh = () => {
        if (loading) return messageApi.info('Working hard, please wait!');
        setPhotoUrl('');
        setPhotoData('');
        setTransparentUrl('');
        setOriginalDataUrl('');
        setCutoutDataUrl('');
        setIsEditing(false);
        maskRef.current = null;
        originalImgRef.current = null;
    };

    const isPresetActive = (p) => p.key === activePreset;

    return (
        <>
            {contextHolder}
            <Spin
                spinning={removeBgStatus === REMOVE_BACKGROUND_STATUS.LOADING}
                tip={`Loading ${MODEL_ID} locally...`}
            >
                <div className={cn('rounded-md shadow-lg border-t overflow-hidden border-t-gray-600 antialiased', isGrid ? 'tr' : 'polka')}>
                    {/* 工具栏 */}
                    <div className="flex gap-4 justify-center flex-col-reverse bg-white p-2 border-b shadow-md md:flex-row md:justify-between flex-wrap">
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            {!isBlurMode && (
                                <>
                                    {/* 背景预设 */}
                                    <div className="flex items-center gap-1">
                                        <Icon name="Palette" className="text-slate-400 text-sm" />
                                        {BG_PRESETS.map((p) => (
                                            <button
                                                key={p.key}
                                                type="button"
                                                onClick={() => applyPreset(p)}
                                                title={p.key}
                                                className={cn(
                                                    'w-6 h-6 rounded-full border text-[10px] flex items-center justify-center transition-all',
                                                    isPresetActive(p)
                                                        ? 'border-blue-500 ring-2 ring-blue-200 scale-110'
                                                        : 'border-gray-200 hover:border-blue-300',
                                                )}
                                                style={{
                                                    background: p.bg,
                                                }}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                        <ColorPicker allowClear size="small" value={bgColor} onChange={onBgChange} />
                                    </div>
                                    <Button
                                        type="text"
                                        shape="circle"
                                        className={isGrid && 'text-[#1677ff]'}
                                        icon={<Icon name="Grip" />}
                                        onClick={() => setIsGrid(!isGrid)}
                                    />
                                    {/* 精修开关 */}
                                    <Button
                                        type={isEditing ? 'primary' : 'text'}
                                        shape="circle"
                                        icon={<Icon name="Brush" />}
                                        disabled={!cutoutDataUrl || isBlurMode}
                                        onClick={() => (isEditing ? exitEdit() : enterEdit())}
                                        title="Refine edges"
                                    />
                                </>
                            )}
                            {isBlurMode && (
                                <div className="flex w-48 items-center gap-3 text-xs text-slate-600">
                                    <Icon name="Sparkles" />
                                    <Slider
                                        className="flex-1"
                                        min={4}
                                        max={36}
                                        value={blurRadius}
                                        onChange={setBlurRadius}
                                        tooltip={{ formatter: (value) => `${value}px` }}
                                    />
                                </div>
                            )}
                            <div className="active:[&_.ant-btn:not(:disabled)]:bg-[#1677ff]/20">
                                <Button
                                    type="text"
                                    shape="circle"
                                    className="[&_span]:active:text-[#1677ff]"
                                    icon={<Icon name="SplitSquareHorizontal" />}
                                    onMouseDown={() => setShowOrigin(true)}
                                    onMouseLeave={() => setShowOrigin(false)}
                                    onMouseUp={() => setShowOrigin(false)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 items-center justify-center">
                            {photoData && (
                                <div className="text-xs opacity-60">
                                    {photoData.width} x {photoData.height} px
                                </div>
                            )}
                            <DownBtn disabled={!transparentUrl} loading={loading} toDownload={toDownload} toCopy={toCopy} />
                            <Button
                                type="text"
                                disabled={!transparentUrl}
                                loading={loading}
                                icon={<Icon name="Eraser" />}
                                onClick={toRefresh}
                            />
                        </div>
                    </div>

                    {/* 精修画笔控制 */}
                    {isEditing && (
                        <div className="flex items-center gap-4 px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-slate-600 flex-wrap">
                            <Icon name="Brush" className="text-amber-500" />
                            <span className="font-medium">Refine edges</span>
                            <div className="flex items-center gap-2">
                                <span>Size</span>
                                <Slider
                                    className="w-24"
                                    min={4}
                                    max={80}
                                    value={brushSize}
                                    onChange={setBrushSize}
                                    tooltip={{ formatter: (v) => `${v}px` }}
                                />
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    size="small"
                                    type={brushMode === 'erase' ? 'primary' : 'default'}
                                    onClick={() => setBrushMode('erase')}
                                >
                                    🧽 Erase
                                </Button>
                                <Button
                                    size="small"
                                    type={brushMode === 'restore' ? 'primary' : 'default'}
                                    onClick={() => setBrushMode('restore')}
                                >
                                    ✏️ Restore
                                </Button>
                            </div>
                            <Button size="small" onClick={exitEdit} type="text">
                                Done
                            </Button>
                        </div>
                    )}

                    {/* 画布区 */}
                    <div className="relative min-h-[200px] p-10">
                        <div className="flex w-full items-center justify-center relative z-10">
                            {!photoUrl && <UploadDragger beforeUpload={beforeUpload} />}
                            <Spin spinning={loading} delay={500}>
                                {photoUrl && (
                                    <div
                                        className={cn(
                                            'overflow-hidden w-auto',
                                            transparentUrl && 'opacity-0 absolute top-0 left-0 transition-all z-10',
                                            showOrigin && 'opacity-100',
                                        )}
                                    >
                                        <img
                                            src={photoUrl}
                                            alt="Original image before background removal"
                                            width={imageSize.width}
                                            height={imageSize.height}
                                            className="w-full object-cover"
                                        />
                                    </div>
                                )}
                                {transparentUrl && !isEditing && (
                                    <div className="overflow-hidden w-auto relative z-[9]">
                                        <img
                                            src={transparentUrl}
                                            alt={isBlurMode ? 'Image with blurred background' : 'Image with background removed'}
                                            className="w-full"
                                        />
                                    </div>
                                )}
                                {transparentUrl && !isBlurMode && !isEditing && (
                                    <div
                                        className="absolute z-0 w-full h-full top-0 left-0"
                                        style={{
                                            background: bgColor,
                                        }}
                                    />
                                )}
                                {/* 精修画布 */}
                                {isEditing && transparentUrl && (
                                    <div
                                        className="relative z-[10] w-full max-w-[950px] overflow-hidden rounded"
                                        style={{ background: bgColor || 'transparent' }}
                                    >
                                        <canvas
                                            ref={editCanvasRef}
                                            className="w-full touch-none cursor-crosshair rounded border-2 border-dashed border-amber-400"
                                            onPointerDown={onEditPointerDown}
                                            onPointerMove={onEditPointerMove}
                                            onPointerUp={onEditPointerUp}
                                            onPointerLeave={onEditPointerUp}
                                        />
                                    </div>
                                )}
                            </Spin>
                        </div>
                    </div>
                </div>
            </Spin>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </>
    );
}

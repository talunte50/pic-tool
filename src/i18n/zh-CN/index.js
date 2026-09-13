import nav from './nav';
import editor from './editor';
import beautifier from './beautifier';
import rounded from './rounded';
import remover from './remover';
import blurBackground from './blurBackground';
import compressor from './compressor';
import longImage from './longImage';
import screenshot from './screenshot';
import videoConvert from './videoConvert';
import convert from './convert';
import viewer from './viewer';
import legal from './legal';

export default {
    title: '在线截图、图片编辑与格式转换工具 | pic-tool',
    description:
        '免费在线截图和编辑照片，直接在浏览器中截图和调整图像大小并为任何照片添加滤镜。将图像转换为各种格式，如 jpg、png、jpeg 或 webp。截取特定区域或滚动截取整个页面。',
    keywords:
        'pic-tool,截图,长页面,编辑照片,照片转换器,图像转换器,在线编辑器,在线更改图像格式,将图像转换为jpg,jpg转webp,jpg转png',
    privacy: '隐私',
    terms: '条款',
    blog: '博客',
    footerToolsTitle: 'pic-tool 核心工具',
    footerToolsIntro: '截图、图片、视频与本地浏览器工具快捷入口。',
    localProcessing: {
        title: '无需上传，本地处理',
        cont1: '你的文件完全在浏览器本地处理。pic-tool 的这些工具无需将图片或视频上传到服务器。',
        cont2: '适用于截图、私人照片、文档、教程、产品图片和随手记录，隐私更有保障。'
    },
    moreTools: '更多工具',
    editorCreditPre: '图片编辑器由 ',
    editorCreditPost: ' 提供',
    copyright: '版权所有 © 2025 pic-tool',
    askAiTitle: '向 {ai} 询问 pic-tool',
    legal,
    nav,
    editor,
    beautifier,
    rounded,
    remover,
    blurBackground,
    compressor,
    longImage,
    screenshot,
    videoConvert,
    convert,
    viewer
};

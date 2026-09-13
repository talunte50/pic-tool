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

export default {
    askAiTitle: 'pic-tool について {ai} に質問する',
    title: 'スクリーンショットと写真編集をオンラインで無料利用 | pic-tool',
    description:
        'オンラインで写真を無料で編集、リサイズ、フィルタリングができます。ブラウザで写真を編集、画像をjpg/png/jpeg/webpに変換、簡単に画面の一部または全体をスクリーンショットできます',
    keywords:
        'pic-tool、スクリーンショット、写真編集、画像変換、オンラインエディター、オンラインで画像フォーマットを変更、画像をjpgに変換、jpgをwebpに変換、jpgをpngに変換',
    privacy: 'プライバシー',
    terms: '利用規約',
    blog: 'ブログ',
    footerToolsTitle: 'pic-tool の主要ツール',
    footerToolsIntro: 'スクリーンショット・画像・動画・ブラウザツールへのクイックリンク。',
    localProcessing: {
        title: 'アップロード不要、ブラウザ内で処理',
        cont1: 'ファイルはブラウザ内でローカル処理されます。これらのツールでは画像や動画をサーバーにアップロードする必要はありません。',
        cont2: 'スクリーンショット、プライベートな写真、ドキュメント、チュートリアル、製品画像、メモなどに。プライバシーを守りながら素早く処理できます。'
    },
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

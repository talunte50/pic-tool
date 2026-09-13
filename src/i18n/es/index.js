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
    title: 'Editor de fotos y capturas online gratis | pic-tool',
    description:
        'Edita fotos en línea de forma gratuita, redimensiona y filtra cualquier foto, edita fotos en el navegador, convierte imágenes a jpg/png/jpeg/webp, captura fácilmente áreas o páginas completas',
    keywords:
        'pic-tool, captura de pantalla, editar foto, convertidor de fotos, convertidor de imágenes, editor en línea, cambiar formato de imagen en línea, convertir imagen a jpg, jpg a webp, jpg a png',
    privacy: 'Privacidad',
    terms: 'Términos',
    blog: 'Blog',
    footerToolsTitle: 'Herramientas principales de pic-tool',
    footerToolsIntro: 'Enlaces rápidos a las herramientas de captura, imagen, vídeo y navegador local.',
    localProcessing: {
        title: 'Sin subidas, procesamiento local',
        cont1: 'Tus archivos se procesan localmente en tu navegador. pic-tool no necesita subir imágenes ni vídeos a un servidor para estas herramientas.',
        cont2: 'Úsalo para capturas de pantalla, fotos privadas, documentos, tutoriales, imágenes de productos y notas rápidas con mejor privacidad.'
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

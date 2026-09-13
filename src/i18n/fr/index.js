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
    title: 'Éditeur photo et outil de capture en ligne gratuit | pic-tool',
    description:
        "Éditez des photos en ligne gratuitement, redimensionnez et appliquez des filtres à n'importe quelle photo, éditez des photos dans le navigateur, convertissez des images en jpg/png/jpeg/webp, capturez facilement des zones ou des pages entières",
    keywords:
        "pic-tool, capture d'écran, éditer photo, convertisseur de photos, convertisseur d'images, éditeur en ligne, changer le format d'image en ligne, convertir une image en jpg, jpg en webp, jpg en png",
    privacy: 'Confidentialité',
    terms: 'Conditions',
    blog: 'Blog',
    footerToolsTitle: 'Outils principaux de pic-tool',
    footerToolsIntro: "Liens rapides vers les outils de capture d'écran, d'image, de vidéo et de navigateur local.",
    localProcessing: {
        title: 'Sans téléversement, traitement local',
        cont1: "Vos fichiers sont traités localement dans votre navigateur. pic-tool n'a pas besoin de téléverser d'images ou de vidéos vers un serveur pour ces outils.",
        cont2: "Idéal pour les captures d'écran, photos privées, documents, tutoriels, images de produits et notes rapides, en préservant votre vie privée."
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

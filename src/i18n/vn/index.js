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
    askAiTitle: 'Hỏi {ai} về pic-tool',
    title: 'Chỉnh sửa ảnh và chụp màn hình online miễn phí | pic-tool',
    description:
        'Chỉnh sửa ảnh trực tuyến miễn phí, thay đổi kích thước và lọc bất kỳ ảnh nào, chỉnh sửa ảnh trên trình duyệt, chuyển đổi ảnh sang jpg/png/jpeg/webp, dễ dàng chụp ảnh vùng hoặc toàn trang',
    keywords:
        'pic-tool, chụp ảnh màn hình, chỉnh sửa ảnh, bộ chuyển đổi ảnh, bộ chuyển đổi hình ảnh, trình chỉnh sửa trực tuyến, thay đổi định dạng hình ảnh trực tuyến, chuyển đổi hình ảnh sang jpg, jpg sang webp, jpg sang png',
    privacy: 'Quyền riêng tư',
    terms: 'Điều khoản',
    blog: 'Blog',
    footerToolsTitle: 'Công cụ chính của pic-tool',
    footerToolsIntro: 'Liên kết nhanh đến công cụ chụp màn hình, ảnh, video và trình duyệt cục bộ.',
    localProcessing: {
        title: 'Không cần tải lên, xử lý cục bộ',
        cont1: 'Tệp của bạn được xử lý cục bộ ngay trong trình duyệt. pic-tool không cần tải ảnh hoặc video lên máy chủ cho các công cụ này.',
        cont2: 'Dùng cho chụp màn hình, ảnh riêng tư, tài liệu, hướng dẫn, ảnh sản phẩm và ghi chú nhanh với quyền riêng tư tốt hơn.'
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

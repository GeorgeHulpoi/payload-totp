import type { CustomTranslationsObject } from "./types.js";

export const vi: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Ứng dụng xác thực',
        configured: 'Đã cấu hình',
        errors: {
            alreadySet: 'Bạn đã thiết lập TOTP.',
        },
        fieldDescription:
            'Sử dụng ứng dụng xác thực hoặc tiện ích mở rộng trình duyệt để nhận mã xác thực hai yếu tố khi được yêu cầu.',
        forceTotp: {
            description: 'Nếu được chọn, người dùng này sẽ được yêu cầu thiết lập và sử dụng TOTP.',
            label: 'Bắt buộc TOTP'
        },
        setup: {
            addCodeManually: 'Thêm mã thủ công',
            button: 'Thiết lập',
            description:
                'Bạn cần một ứng dụng xác thực hai yếu tố như <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> để hoàn thành quá trình này. Sau khi cài đặt, hãy quét mã QR bên dưới vào ứng dụng của bạn.',
            enterCode:
                'Nhập mã xác thực {digits} chữ số được tạo bởi ứng dụng của bạn:',
            incorrectCode: 'Mã không chính xác. Nếu lỗi này lặp lại, hãy quét lại mã QR.',
            title: 'Thiết lập Xác thực Hai Yếu tố',
        },
        verify: {
            title: 'Xác minh',
        },
    },
}; 

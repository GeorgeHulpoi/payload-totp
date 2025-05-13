import type { CustomTranslationsObject } from "./types.js";

export const ko: CustomTranslationsObject = {
    totpPlugin: {
        authApp: '인증 앱',
        configured: '설정됨',
        errors: {
            alreadySet: '이미 TOTP가 설정되어 있습니다.',
        },
        fieldDescription:
            '인증이 필요할 때 인증 앱이나 브라우저 확장 프로그램을 사용하여 2단계 인증 코드를 받으세요.',
        forceTotp: {
            description: '선택하면 이 사용자는 TOTP를 설정하고 사용해야 합니다.',
            label: 'TOTP 강제 적용'
        },
        setup: {
            addCodeManually: '수동으로 코드 추가',
            button: '설정',
            description:
                '이 과정을 완료하려면 <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a>와 같은 2단계 인증 앱이 필요합니다. 앱을 설치한 후 아래의 QR 코드를 스캔하세요.',
            enterCode:
                '앱에서 생성된 {digits}자리 인증 코드를 입력하세요:',
            incorrectCode: '잘못된 코드입니다. 이 오류가 반복되면 QR 코드를 다시 스캔하세요.',
            title: '2단계 인증 설정',
        },
        verify: {
            title: '인증',
        },
    },
}; 

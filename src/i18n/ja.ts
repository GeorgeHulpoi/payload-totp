import type { CustomTranslationsObject } from "./types.js";

export const ja: CustomTranslationsObject = {
    totpPlugin: {
        authApp: '認証アプリ',
        configured: '設定済み',
        errors: {
            alreadySet: 'TOTPは既に設定されています。',
        },
        fieldDescription:
            'プロンプトが表示されたときに、認証アプリまたはブラウザ拡張機能を使用して二要素認証コードを取得してください。',
        forceTotp: {
            description: 'チェックすると、このユーザーはTOTPの設定と使用が必要になります。',
            label: 'TOTPを強制'
        },
        setup: {
            addCodeManually: 'コードを手動で追加',
            button: '設定',
            description:
                'このプロセスを完了するには、<a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a>などの二要素認証アプリが必要です。アプリをインストールした後、以下のQRコードをスキャンしてください。',
            enterCode:
                'アプリで生成された{digits}桁の認証コードを入力してください：',
            incorrectCode: 'コードが正しくありません。このエラーが繰り返される場合は、QRコードを再スキャンしてください。',
            title: '二要素認証の設定',
        },
        verify: {
            title: '認証',
        },
    },
}; 

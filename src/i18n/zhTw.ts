import type { CustomTranslationsObject } from "./types.js";

export const zhTw: CustomTranslationsObject = {
    totpPlugin: {
        authApp: '驗證器應用程式',
        configured: '已設定',
        errors: {
            alreadySet: '您已經設定過 TOTP。',
        },
        fieldDescription:
            '在需要時使用驗證器應用程式或瀏覽器擴充功能來獲取雙因素驗證碼。',
        forceTotp: {
            description: '如果選中此框，則該用戶將被要求設置並使用TOTP。',
            label: '強制啟用TOTP'
        },
        setup: {
            addCodeManually: '手動新增驗證碼',
            button: '設定',
            description:
                '您需要一個雙因素驗證應用程式，例如 <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> 來完成此過程。安裝後，請使用您的應用程式掃描下方的 QR 碼。',
            enterCode:
                '請輸入您的應用程式生成的 {digits} 位數驗證碼：',
            incorrectCode: '驗證碼錯誤。如果重複出現此錯誤，請重新掃描 QR 碼。',
            title: '設定雙因素驗證',
        },
        verify: {
            title: '驗證',
        },
    },
}; 

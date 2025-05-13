import type { CustomTranslationsObject } from "./types.js";

export const tr: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Kimlik doğrulama uygulaması',
        configured: 'Yapılandırıldı',
        errors: {
            alreadySet: 'TOTP zaten ayarlanmış.',
        },
        fieldDescription:
            'İstendiğinde iki faktörlü kimlik doğrulama kodlarını almak için bir kimlik doğrulama uygulaması veya tarayıcı eklentisi kullanın.',
        forceTotp: {
            description: 'İşaretlenirse, bu kullanıcının TOTP\'yi kurması ve kullanması gerekir.',
            label: 'TOTP\'yi Zorunlu Kıl'
        },
        setup: {
            addCodeManually: 'Kodu manuel olarak ekle',
            button: 'Kurulum',
            description:
                'Bu işlemi tamamlamak için <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> gibi bir iki faktörlü kimlik doğrulama uygulamasına ihtiyacınız olacak. Birini yükledikten sonra, aşağıdaki QR Kodu uygulamanıza tarayın.',
            enterCode:
                'Uygulamanızın oluşturduğu {digits} haneli kimlik doğrulama kodunu girin:',
            incorrectCode: 'Yanlış kod. Bu hata tekrarlanırsa, QR kodu tekrar tarayın.',
            title: 'İki Faktörlü Kimlik Doğrulama Kurulumu',
        },
        verify: {
            title: 'Doğrulama',
        },
    },
}; 

import type { CustomTranslationsObject } from "./types.js";

export const az: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Autentifikasiya tətbiqi',
        configured: 'Konfiqurasiya edilib',
        errors: {
            alreadySet: 'Siz artıq TOTP quraşdırmısınız.',
        },
        fieldDescription:
            'Tələb olunduqda iki faktorlu autentifikasiya kodlarını almaq üçün autentifikasiya tətbiqi və ya brauzer genişlənməsindən istifadə edin.',
        forceTotp: {
            description: 'Əgər işarələnibsə, bu istifadəçi TOTP qurmalı və istifadə etməlidir.',
            label: 'TOTP məcbur et'
        },
        setup: {
            addCodeManually: 'Kodu manual əlavə et',
            button: 'Quraşdır',
            description:
                'Bu prosesi tamamlamaq üçün <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> kimi iki faktorlu autentifikasiya tətbiqinə ehtiyacınız olacaq. Birini quraşdırdıqdan sonra, aşağıdakı QR Kodu tətbiqinizə skan edin.',
            enterCode:
                'Tətbiqiniz tərəfindən yaradılan {digits} rəqəmli autentifikasiya kodunu daxil edin:',
            incorrectCode: 'Yanlış kod. Bu xəta təkrar olunarsa, QR kodu yenidən skan edin.',
            title: 'İki Faktorlu Autentifikasiya Quraşdırması',
        },
        verify: {
            title: 'Doğrulama',
        },
    },
}; 

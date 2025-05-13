import type { CustomTranslationsObject } from "./types.js";

export const sv: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Autentiseringsapp',
        configured: 'Konfigurerad',
        errors: {
            alreadySet: 'Du har redan TOTP konfigurerat.',
        },
        fieldDescription:
            'Använd en autentiseringsapp eller webbläsartillägg för att få tvåfaktorsautentiseringskoder när du uppmanas.',
        forceTotp: {
            description: 'Om markerad måste den här användaren konfigurera och använda TOTP.',
            label: 'Tvinga TOTP'
        },
        setup: {
            addCodeManually: 'Lägg till kod manuellt',
            button: 'Konfigurera',
            description:
                'Du behöver en tvåfaktorsautentiseringsapp som <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> för att slutföra denna process. Efter installation, skanna QR-koden nedan i din applikation.',
            enterCode:
                'Ange den {digits}-siffriga autentiseringskoden som genereras av din app:',
            incorrectCode: 'Felaktig kod. Om detta fel upprepas, skanna QR-koden igen.',
            title: 'Konfigurera tvåfaktorsautentisering',
        },
        verify: {
            title: 'Verifiering',
        },
    },
}; 

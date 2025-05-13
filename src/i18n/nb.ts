import type { CustomTranslationsObject } from "./types.js";

export const nb: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Autentiseringsapp',
        configured: 'Konfigurert',
        errors: {
            alreadySet: 'Du har allerede satt opp TOTP.',
        },
        fieldDescription:
            'Bruk en autentiseringsapp eller nettleserutvidelse for å få tofaktorautentiseringskoder når du blir bedt om det.',
        forceTotp: {
            description: 'Hvis avkrysset, må denne brukeren sette opp og bruke TOTP.',
            label: 'Tving TOTP'
        },
        setup: {
            addCodeManually: 'Legg til kode manuelt',
            button: 'Konfigurer',
            description:
                'Du trenger en tofaktorautentiseringsapp som <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> for å fullføre denne prosessen. Etter installasjon, skann QR-koden nedenfor inn i applikasjonen din.',
            enterCode:
                'Skriv inn {digits}-sifret autentiseringskode generert av appen din:',
            incorrectCode: 'Feil kode. Hvis denne feilen gjentar seg, skann QR-koden på nytt.',
            title: 'Konfigurer tofaktorautentisering',
        },
        verify: {
            title: 'Verifisering',
        },
    },
}; 

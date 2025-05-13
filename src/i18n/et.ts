import type { CustomTranslationsObject } from "./types.js";

export const et: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Autentimise rakendus',
        configured: 'Konfigureeritud',
        errors: {
            alreadySet: 'TOTP on teil juba seadistatud.',
        },
        fieldDescription:
            'Kasutage autentimise rakendust või brauseri laiendust kahefaktorilise autentimise koodide saamiseks, kui seda palutakse.',
        forceTotp: {
            description: 'Kui see on märgitud, peab see kasutaja seadistama ja kasutama TOTP-d.',
            label: 'Sunni TOTP'
        },
        setup: {
            addCodeManually: 'Lisa kood käsitsi',
            button: 'Seadista',
            description:
                'Selle protsessi lõpuleviimiseks vajate kahefaktorilise autentimise rakendust, nagu <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a>. Pärast rakenduse installimist skaneerige allolev QR-kood oma rakendusesse.',
            enterCode:
                'Sisestage oma rakenduse genereeritud {digits}-kohaline autentimiskood:',
            incorrectCode: 'Vale kood. Kui see viga kordub, skaneerige QR-kood uuesti.',
            title: 'Kahefaktorilise autentimise seadistamine',
        },
        verify: {
            title: 'Verifitseerimine',
        },
    },
}; 

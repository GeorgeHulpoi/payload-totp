import type { CustomTranslationsObject } from "./types.js";

export const sl: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Aplikacija za avtentikacijo',
        configured: 'Konfigurirano',
        errors: {
            alreadySet: 'TOTP je že nastavljen.',
        },
        fieldDescription:
            'Uporabite aplikacijo za avtentikacijo ali razširitev brskalnika za pridobivanje dvočlenih avtentikacijskih kod, ko vas sistem za to zaprosi.',
        forceTotp: {
            description: 'Če je označeno, bo ta uporabnik moral nastaviti in uporabljati TOTP.',
            label: 'Vsili TOTP'
        },
        setup: {
            addCodeManually: 'Dodaj kodo ročno',
            button: 'Nastavi',
            description:
                'Za dokončanje tega postopka boste potrebovali aplikacijo za dvočleno avtentikacijo, kot je <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a>. Po namestitvi skenirajte spodnjo QR kodo v vašo aplikacijo.',
            enterCode:
                'Vnesite {digits}-mestno avtentikacijsko kodo, ki jo generira vaša aplikacija:',
            incorrectCode: 'Napačna koda. Če se ta napaka ponovi, ponovno skenirajte QR kodo.',
            title: 'Nastavitev dvočlene avtentikacije',
        },
        verify: {
            title: 'Preverjanje',
        },
    },
}; 

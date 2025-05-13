import type { CustomTranslationsObject } from "./types.js";

export const cs: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Autentizační aplikace',
        configured: 'Nakonfigurováno',
        errors: {
            alreadySet: 'TOTP je již nastaveno.',
        },
        fieldDescription:
            'Použijte autentizační aplikaci nebo rozšíření prohlížeče pro získání dvoufaktorových autentizačních kódů při výzvě.',
        forceTotp: {
            description: 'Je-li zaškrtnuto, bude tento uživatel muset nastavit a používat TOTP.',
            label: 'Vynutit TOTP'
        },
        setup: {
            addCodeManually: 'Přidat kód ručně',
            button: 'Nastavit',
            description:
                'Pro dokončení tohoto procesu budete potřebovat dvoufaktorovou autentizační aplikaci, jako je <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a>. Po instalaci naskenujte níže uvedený QR kód do vaší aplikace.',
            enterCode:
                'Zadejte {digits}-místný autentizační kód vygenerovaný vaší aplikací:',
            incorrectCode: 'Nesprávný kód. Pokud se tato chyba opakuje, znovu naskenujte QR kód.',
            title: 'Nastavení dvoufaktorové autentizace',
        },
        verify: {
            title: 'Ověření',
        },
    },
}; 

import type { CustomTranslationsObject } from "./types.js";

export const hu: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Hitelesítő alkalmazás',
        configured: 'Konfigurálva',
        errors: {
            alreadySet: 'Már be van állítva a TOTP.',
        },
        fieldDescription:
            'Használjon hitelesítő alkalmazást vagy böngésző bővítményt kétfaktoros hitelesítési kódok beszerzéséhez amikor szükséges.',
        forceTotp: {
            description: 'Ha be van jelölve, ennek a felhasználónak be kell állítania és használnia kell a TOTP-t.',
            label: 'TOTP kényszerítése'
        },
        setup: {
            addCodeManually: 'Kód manuális hozzáadása',
            button: 'Beállítás',
            description:
                'Szüksége lesz egy kétfaktoros hitelesítő alkalmazásra, mint például a <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> a folyamat befejezéséhez. Telepítés után olvassa be az alábbi QR kódot az alkalmazásába.',
            enterCode:
                'Írja be az alkalmazása által generált {digits} számjegyű hitelesítési kódot:',
            incorrectCode: 'Helytelen kód. Ha ez a hiba ismétlődik, olvassa be újra a QR kódot.',
            title: 'Kétfaktoros hitelesítés beállítása',
        },
        verify: {
            title: 'Ellenőrzés',
        },
    },
}; 

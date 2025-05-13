import type { CustomTranslationsObject } from "./types.js";

export const sk: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Autentifikačná aplikácia',
        configured: 'Nakonfigurované',
        errors: {
            alreadySet: 'TOTP už máte nastavené.',
        },
        fieldDescription:
            'Použite autentifikačnú aplikáciu alebo rozšírenie prehliadača na získanie kódov dvojfaktorovej autentifikácie, keď budete požiadaní.',
        forceTotp: {
            description: 'Ak je začiarknuté, tento používateľ bude musieť nastaviť a používať TOTP.',
            label: 'Vynútiť TOTP'
        },
        setup: {
            addCodeManually: 'Pridať kód manuálne',
            button: 'Nastaviť',
            description:
                'Budete potrebovať aplikáciu pre dvojfaktorovú autentifikáciu, ako je <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> na dokončenie tohto procesu. Po inštalácii naskenujte QR kód nižšie do vašej aplikácie.',
            enterCode:
                'Zadajte {digits}-ciferný autentifikačný kód vygenerovaný vašou aplikáciou:',
            incorrectCode: 'Nesprávny kód. Ak sa táto chyba opakuje, znova naskenujte QR kód.',
            title: 'Nastavenie dvojfaktorovej autentifikácie',
        },
        verify: {
            title: 'Overenie',
        },
    },
}; 

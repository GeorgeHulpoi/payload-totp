import type { CustomTranslationsObject } from "./types.js";

export const ro: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Aplicație de autentificare',
        configured: 'Configurat',
        errors: {
            alreadySet: 'Aveți deja TOTP configurat.',
        },
        fieldDescription:
            'Folosiți o aplicație de autentificare sau extensie de browser pentru a obține coduri de autentificare cu două factori când vi se solicită.',
        forceTotp: {
            description: 'Dacă este bifat, acest utilizator va trebui să configureze și să utilizeze TOTP.',
            label: 'Forțează TOTP'
        },
        setup: {
            addCodeManually: 'Adăugați codul manual',
            button: 'Configurare',
            description:
                'Veți avea nevoie de o aplicație de autentificare cu două factori precum <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> pentru a finaliza acest proces. După instalare, scanați codul QR de mai jos în aplicația dvs.',
            enterCode:
                'Introduceți codul de autentificare cu {digits} cifre generat de aplicația dvs.:',
            incorrectCode: 'Cod incorect. Dacă această eroare se repetă, scanați din nou codul QR.',
            title: 'Configurare autentificare cu două factori',
        },
        verify: {
            title: 'Verificare',
        },
    },
}; 

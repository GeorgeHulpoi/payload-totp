import type { CustomTranslationsObject } from "./types.js";

export const ca: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Aplicació d\'autenticació',
        configured: 'Configurat',
        errors: {
            alreadySet: 'Ja tens TOTP configurat.',
        },
        fieldDescription:
            'Utilitza una aplicació d\'autenticació o una extensió del navegador per obtenir codis d\'autenticació de dos factors quan se\'t demani.',
        forceTotp: {
            description: 'Si està marcat, aquest usuari haurà de configurar i utilitzar TOTP.',
            label: 'Força TOTP'
        },
        setup: {
            addCodeManually: 'Afegir codi manualment',
            button: 'Configurar',
            description:
                'Necessitaràs una aplicació d\'autenticació de dos factors com <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> per completar aquest procés. Després d\'instal·lar-ne una, escaneja el codi QR següent amb la teva aplicació.',
            enterCode:
                'Introdueix el codi d\'autenticació de {digits} xifres generat per la teva aplicació:',
            incorrectCode: 'Codi incorrecte. Si aquest error es repeteix, torna a escanejar el codi QR.',
            title: 'Configurar l\'autenticació de dos factors',
        },
        verify: {
            title: 'Verificació',
        },
    },
}; 

import type { CustomTranslationsObject } from "./types.js";

export const nl: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Authenticator app',
        configured: 'Geconfigureerd',
        errors: {
            alreadySet: 'Je hebt al TOTP ingesteld.',
        },
        fieldDescription:
            'Gebruik een authenticator app of browserextensie om tweefactorauthenticatiecodes te krijgen wanneer daarom wordt gevraagd.',
        forceTotp: {
            description: 'Indien aangevinkt, moet deze gebruiker TOTP instellen en gebruiken.',
            label: 'TOTP afdwingen'
        },
        setup: {
            addCodeManually: 'Code handmatig toevoegen',
            button: 'Instellen',
            description:
                'Je hebt een tweefactorauthenticatie app nodig zoals <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> om dit proces te voltooien. Na installatie, scan de QR-code hieronder in je app.',
            enterCode:
                'Voer de {digits}-cijferige authenticatiecode in die door je app is gegenereerd:',
            incorrectCode: 'Onjuiste code. Als deze fout zich herhaalt, scan de QR-code opnieuw.',
            title: 'Tweefactorauthenticatie instellen',
        },
        verify: {
            title: 'Verificatie',
        },
    },
}; 

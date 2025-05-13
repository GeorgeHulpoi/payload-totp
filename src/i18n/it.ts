import type { CustomTranslationsObject } from "./types.js";

export const it: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'App di autenticazione',
        configured: 'Configurato',
        errors: {
            alreadySet: 'Hai già configurato TOTP.',
        },
        fieldDescription:
            'Utilizza un\'app di autenticazione o un\'estensione del browser per ottenere i codici di autenticazione a due fattori quando richiesto.',
        forceTotp: {
            description: 'Se selezionato, questo utente dovrà configurare e utilizzare TOTP.',
            label: 'Forza TOTP'
        },
        setup: {
            addCodeManually: 'Aggiungi codice manualmente',
            button: 'Configura',
            description:
                'Avrai bisogno di un\'app di autenticazione a due fattori come <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> per completare questo processo. Dopo averne installata una, scansiona il codice QR sottostante nella tua applicazione.',
            enterCode:
                'Inserisci il codice di autenticazione a {digits} cifre generato dalla tua app:',
            incorrectCode: 'Codice non corretto. Se questo errore si ripete, riscansiona il codice QR.',
            title: 'Configurazione Autenticazione a Due Fattori',
        },
        verify: {
            title: 'Verifica',
        },
    },
}; 

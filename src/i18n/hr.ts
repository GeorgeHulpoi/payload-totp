import type { CustomTranslationsObject } from "./types.js";

export const hr: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Aplikacija za autentifikaciju',
        configured: 'Konfigurirano',
        errors: {
            alreadySet: 'Već imate postavljen TOTP.',
        },
        fieldDescription:
            'Koristite aplikaciju za autentifikaciju ili proširenje preglednika za dobivanje kodova dvofaktorske autentifikacije kada se to zatraži.',
        forceTotp: {
            description: 'Ako je označeno, ovaj korisnik će morati postaviti i koristiti TOTP.',
            label: 'Prisili TOTP'
        },
        setup: {
            addCodeManually: 'Dodaj kod ručno',
            button: 'Postavi',
            description:
                'Trebat ćete aplikaciju za dvofaktorsku autentifikaciju kao što je <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> za dovršetak ovog postupka. Nakon instalacije, skenirajte QR kod u svoju aplikaciju.',
            enterCode:
                'Unesite {digits}-znamenkasti autentifikacijski kod koji je generirala vaša aplikacija:',
            incorrectCode: 'Netočan kod. Ako se ova greška ponavlja, ponovno skenirajte QR kod.',
            title: 'Postavljanje dvofaktorske autentifikacije',
        },
        verify: {
            title: 'Verifikacija',
        },
    },
}; 

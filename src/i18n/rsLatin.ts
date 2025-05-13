import type { CustomTranslationsObject } from "./types.js";

export const rsLatin: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Aplikacija za autentifikaciju',
        configured: 'Konfigurisano',
        errors: {
            alreadySet: 'Već imate podešenu TOTP autentifikaciju.',
        },
        fieldDescription:
            'Koristite aplikaciju za autentifikaciju ili proširenje pregledača da biste dobili kodove za dvofaktorsku autentifikaciju kada budete upitani.',
        forceTotp: {
            description: 'Ako je označeno, ovaj korisnik će morati da podesi i koristi TOTP.',
            label: 'Primoraj TOTP'
        },
        setup: {
            addCodeManually: 'Dodaj kod ručno',
            button: 'Podešavanje',
            description:
                'Potrebna vam je aplikacija za dvofaktorsku autentifikaciju kao što je <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> da biste završili ovaj proces. Nakon instalacije, skenirajte QR kod ispod u vašu aplikaciju.',
            enterCode:
                'Unesite {digits}-cifreni autentifikacioni kod koji je generisala vaša aplikacija:',
            incorrectCode: 'Pogrešan kod. Ako se ova greška ponavlja, ponovo skenirajte QR kod.',
            title: 'Podešavanje dvofaktorske autentifikacije',
        },
        verify: {
            title: 'Verifikacija',
        },
    },
}; 

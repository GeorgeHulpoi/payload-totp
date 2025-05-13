import type { CustomTranslationsObject } from "./types.js";

export const pl: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Aplikacja uwierzytelniająca',
        configured: 'Skonfigurowano',
        errors: {
            alreadySet: 'Masz już skonfigurowane TOTP.',
        },
        fieldDescription:
            'Użyj aplikacji uwierzytelniającej lub rozszerzenia przeglądarki, aby otrzymywać kody uwierzytelniania dwuetapowego gdy zostaniesz o to poproszony.',
        forceTotp: {
            description: 'Jeśli zaznaczone, ten użytkownik będzie musiał skonfigurować i używać TOTP.',
            label: 'Wymuś TOTP'
        },
        setup: {
            addCodeManually: 'Dodaj kod ręcznie',
            button: 'Konfiguracja',
            description:
                'Będziesz potrzebować aplikacji do uwierzytelniania dwuetapowego, takiej jak <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a>, aby ukończyć ten proces. Po zainstalowaniu, zeskanuj kod QR poniżej w swojej aplikacji.',
            enterCode:
                'Wprowadź {digits}-cyfrowy kod uwierzytelniania wygenerowany przez Twoją aplikację:',
            incorrectCode: 'Nieprawidłowy kod. Jeśli ten błąd się powtarza, zeskanuj kod QR ponownie.',
            title: 'Konfiguracja uwierzytelniania dwuetapowego',
        },
        verify: {
            title: 'Weryfikacja',
        },
    },
}; 

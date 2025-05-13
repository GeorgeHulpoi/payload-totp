import type { CustomTranslationsObject } from "./types.js";

export const da: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Autentificeringsapp',
        configured: 'Konfigureret',
        errors: {
            alreadySet: 'Du har allerede TOTP sat op.',
        },
        fieldDescription:
            'Brug en autentificeringsapp eller browserudvidelse til at få to-faktor autentificeringskoder, når du bliver bedt om det.',
        forceTotp: {
            description: 'Hvis markeret, skal denne bruger opsætte og bruge TOTP.',
            label: 'Tving TOTP'
        },
        setup: {
            addCodeManually: 'Tilføj kode manuelt',
            button: 'Opsæt',
            description:
                'Du skal bruge en to-faktor autentificeringsapp som <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> for at gennemføre denne proces. Efter installation skal du scanne QR-koden nedenfor i din applikation.',
            enterCode:
                'Indtast den {digits}-cifrede autentificeringskode, der genereres af din app:',
            incorrectCode: 'Forkert kode. Hvis denne fejl gentages, skal du scanne QR-koden igen.',
            title: 'Opsæt To-Faktor Autentificering',
        },
        verify: {
            title: 'Verificering',
        },
    },
}; 

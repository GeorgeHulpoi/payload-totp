import type { CustomTranslationsObject } from "./types.js";

export const de: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Authentifizierungs-App',
        configured: 'Konfiguriert',
        errors: {
            alreadySet: 'Sie haben bereits TOTP eingerichtet.',
        },
        fieldDescription:
            'Verwenden Sie eine Authentifizierungs-App oder Browser-Erweiterung, um bei Aufforderung Codes für die Zwei-Faktor-Authentifizierung zu erhalten.',
        forceTotp: {
            description: 'Wenn diese Option aktiviert ist, muss dieser Benutzer TOTP einrichten und verwenden.',
            label: 'TOTP erzwingen'
        },
        setup: {
            addCodeManually: 'Code manuell hinzufügen',
            button: 'Einrichten',
            description:
                'Sie benötigen eine Zwei-Faktor-Authentifizierungs-App wie <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a>, um diesen Prozess abzuschließen. Nach der Installation scannen Sie den QR-Code unten in Ihre Anwendung.',
            enterCode:
                'Geben Sie den {digits}-stelligen Authentifizierungscode ein, der von Ihrer App generiert wurde:',
            incorrectCode: 'Falscher Code. Wenn dieser Fehler wiederholt auftritt, scannen Sie den QR-Code erneut.',
            title: 'Zwei-Faktor-Authentifizierung einrichten',
        },
        verify: {
            title: 'Verifizierung',
        },
    },
}; 

import type { CustomTranslationsObject } from "./types.js";

export const fr: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Application d\'authentification',
        configured: 'Configuré',
        errors: {
            alreadySet: 'Vous avez déjà configuré l\'authentification à deux facteurs.',
        },
        fieldDescription:
            'Utilisez une application d\'authentification ou une extension de navigateur pour obtenir des codes d\'authentification à deux facteurs lorsque demandé.',
        forceTotp: {
            description: 'Si cette case est cochée, cet utilisateur devra configurer et utiliser TOTP.',
            label: 'Forcer TOTP'
        },
        setup: {
            addCodeManually: 'Ajouter le code manuellement',
            button: 'Configurer',
            description:
                'Vous aurez besoin d\'une application d\'authentification à deux facteurs comme <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> pour compléter ce processus. Après en avoir installé une, scannez le code QR ci-dessous dans votre application.',
            enterCode:
                'Entrez le code d\'authentification à {digits} chiffres généré par votre application :',
            incorrectCode: 'Code incorrect. Si cette erreur se répète, rescannez le code QR.',
            title: 'Configuration de l\'Authentification à Deux Facteurs',
        },
        verify: {
            title: 'Vérification',
        },
    },
}; 

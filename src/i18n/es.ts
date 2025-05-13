import type { CustomTranslationsObject } from "./types.js";

export const es: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Aplicación autenticadora',
        configured: 'Configurado',
        errors: {
            alreadySet: 'Ya tienes TOTP configurado.',
        },
        fieldDescription:
            'Utiliza una aplicación de autenticación o extensión del navegador para obtener códigos de autenticación de dos factores cuando se solicite.',
        forceTotp: {
            description: 'Si está marcado, este usuario deberá configurar y usar TOTP.',
            label: 'Forzar TOTP'
        },
        setup: {
            addCodeManually: 'Agregar código manualmente',
            button: 'Configurar',
            description:
                'Necesitarás una aplicación de autenticación de dos factores como <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> para completar este proceso. Después de instalar una, escanea el código QR que aparece a continuación en tu aplicación.',
            enterCode:
                'Ingresa el código de autenticación de {digits} dígitos generado por tu aplicación:',
            incorrectCode: 'Código incorrecto. Si este error se repite, vuelve a escanear el código QR.',
            title: 'Configurar Autenticación de Dos Factores',
        },
        verify: {
            title: 'Verificación',
        },
    },
}; 

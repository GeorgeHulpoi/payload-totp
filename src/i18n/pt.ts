import type { CustomTranslationsObject } from "./types.js";

export const pt: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Aplicativo autenticador',
        configured: 'Configurado',
        errors: {
            alreadySet: 'Você já tem o TOTP configurado.',
        },
        fieldDescription:
            'Use um aplicativo de autenticação ou extensão do navegador para obter códigos de autenticação de dois fatores quando solicitado.',
        forceTotp: {
            description: 'Se marcado, este usuário será obrigado a configurar e usar o TOTP.',
            label: 'Forçar TOTP'
        },
        setup: {
            addCodeManually: 'Adicionar código manualmente',
            button: 'Configurar',
            description:
                'Você precisará de um aplicativo de autenticação de dois fatores como o <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> para completar este processo. Após instalar um, escaneie o código QR abaixo no seu aplicativo.',
            enterCode:
                'Digite o código de autenticação de {digits} dígitos gerado pelo seu aplicativo:',
            incorrectCode: 'Código incorreto. Se este erro se repetir, escaneie o QR novamente.',
            title: 'Configurar Autenticação de Dois Fatores',
        },
        verify: {
            title: 'Verificação',
        },
    },
}; 

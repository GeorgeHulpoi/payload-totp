import type { CustomTranslationsObject } from "./types.js";

export const ru: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Приложение для аутентификации',
        configured: 'Настроено',
        errors: {
            alreadySet: 'У вас уже настроена двухфакторная аутентификация.',
        },
        fieldDescription:
            'Используйте приложение для аутентификации или расширение браузера для получения кодов двухфакторной аутентификации при запросе.',
        forceTotp: {
            description: 'Если отмечено, этот пользователь должен будет настроить и использовать TOTP.',
            label: 'Принудительный TOTP'
        },
        setup: {
            addCodeManually: 'Добавить код вручную',
            button: 'Настроить',
            description:
                'Для завершения этого процесса вам понадобится приложение для двухфакторной аутентификации, такое как <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a>. После установки отсканируйте QR-код ниже в вашем приложении.',
            enterCode:
                'Введите {digits}-значный код аутентификации, сгенерированный вашим приложением:',
            incorrectCode: 'Неверный код. Если ошибка повторяется, отсканируйте QR-код заново.',
            title: 'Настройка двухфакторной аутентификации',
        },
        verify: {
            title: 'Проверка',
        },
    },
}; 

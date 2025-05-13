import type { CustomTranslationsObject } from "./types.js";

export const uk: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Додаток автентифікації',
        configured: 'Налаштовано',
        errors: {
            alreadySet: 'У вас вже налаштований TOTP.',
        },
        fieldDescription:
            'Використовуйте додаток автентифікації або розширення браузера для отримання кодів двофакторної автентифікації за запитом.',
        forceTotp: {
            description: 'Якщо позначено, цей користувач повинен буде налаштувати та використовувати TOTP.',
            label: 'Примусовий TOTP'
        },
        setup: {
            addCodeManually: 'Додати код вручну',
            button: 'Налаштувати',
            description:
                'Вам знадобиться додаток для двофакторної автентифікації, такий як <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a>, щоб завершити цей процес. Після встановлення відскануйте QR-код нижче у ваш додаток.',
            enterCode:
                'Введіть {digits}-значний код автентифікації, згенерований вашим додатком:',
            incorrectCode: 'Неправильний код. Якщо ця помилка повторюється, відскануйте QR-код знову.',
            title: 'Налаштування двофакторної автентифікації',
        },
        verify: {
            title: 'Перевірка',
        },
    },
}; 

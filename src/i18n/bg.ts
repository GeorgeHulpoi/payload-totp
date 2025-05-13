import type { CustomTranslationsObject } from "./types.js";

export const bg: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Приложение за автентикация',
        configured: 'Конфигурирано',
        errors: {
            alreadySet: 'Вече имате настроен TOTP.',
        },
        fieldDescription:
            'Използвайте приложение за автентикация или разширение на браузъра, за да получите кодове за двуфакторна автентикация, когато се изисква.',
        forceTotp: {
            description: 'Ако е отметнато, този потребител ще трябва да настрои и използва TOTP.',
            label: 'Принудително TOTP'
        },
        setup: {
            addCodeManually: 'Добавете код ръчно',
            button: 'Настройка',
            description:
                'Ще ви трябва приложение за двуфакторна автентикация като <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> за да завършите този процес. След инсталирането, сканирайте QR кода по-долу във вашето приложение.',
            enterCode:
                'Въведете {digits}-цифрения код за автентикация, генериран от вашето приложение:',
            incorrectCode: 'Неверен код. Ако тази грешка се повтаря, сканирайте QR кода отново.',
            title: 'Настройка на двуфакторна автентикация',
        },
        verify: {
            title: 'Проверка',
        },
    },
}; 

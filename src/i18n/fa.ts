import type { CustomTranslationsObject } from "./types.js";

export const fa: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'برنامه احراز هویت',
        configured: 'پیکربندی شده',
        errors: {
            alreadySet: 'شما قبلاً TOTP را تنظیم کرده‌اید.',
        },
        fieldDescription:
            'از یک برنامه احراز هویت یا افزونه مرورگر برای دریافت کدهای احراز هویت دو مرحله‌ای در صورت درخواست استفاده کنید.',
        forceTotp: {
            description: 'در صورت علامت زدن، این کاربر ملزم به تنظیم و استفاده از TOTP خواهد بود.',
            label: 'اجبار TOTP'
        },
        setup: {
            addCodeManually: 'افزودن کد به صورت دستی',
            button: 'راه‌اندازی',
            description:
                'شما به یک برنامه احراز هویت دو مرحله‌ای مانند <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> نیاز دارید تا این فرآیند را تکمیل کنید. پس از نصب، کد QR زیر را در برنامه خود اسکن کنید.',
            enterCode:
                'کد {digits} رقمی احراز هویت تولید شده توسط برنامه خود را وارد کنید:',
            incorrectCode: 'کد نادرست است. اگر این خطا تکرار شد، کد QR را دوباره اسکن کنید.',
            title: 'راه‌اندازی احراز هویت دو مرحله‌ای',
        },
        verify: {
            title: 'تایید',
        },
    },
}; 

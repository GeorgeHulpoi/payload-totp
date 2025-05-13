import type { CustomTranslationsObject } from "./types.js";

export const ar: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'تطبيق المصادقة',
        configured: 'تم التكوين',
        errors: {
            alreadySet: 'لديك بالفعل المصادقة الثنائية مفعلة.',
        },
        fieldDescription:
            'استخدم تطبيق مصادقة أو إضافة متصفح للحصول على رموز المصادقة الثنائية عند الطلب.',
        forceTotp: {
            description: 'إذا تم تحديده، سيُطلب من هذا المستخدم إعداد واستخدام TOTP.',
            label: 'فرض TOTP'
        },
        setup: {
            addCodeManually: 'إضافة الرمز يدوياً',
            button: 'إعداد',
            description:
                'ستحتاج إلى تطبيق مصادقة ثنائية مثل <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> لإكمال هذه العملية. بعد تثبيت التطبيق، قم بمسح رمز QR أدناه في تطبيقك.',
            enterCode:
                'أدخل رمز المصادقة المكون من {digits} أرقام الذي تم إنشاؤه بواسطة تطبيقك:',
            incorrectCode: 'رمز غير صحيح. إذا تكرر هذا الخطأ، قم بإعادة مسح رمز QR.',
            title: 'إعداد المصادقة الثنائية',
        },
        verify: {
            title: 'التحقق',
        },
    },
}; 

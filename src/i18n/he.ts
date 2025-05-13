import type { CustomTranslationsObject } from "./types.js";

export const he: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'אפליקציית אימות',
        configured: 'הוגדר',
        errors: {
            alreadySet: 'כבר הגדרת אימות דו-שלבי.',
        },
        fieldDescription:
            'השתמש באפליקציית אימות או תוסף דפדפן לקבלת קודי אימות דו-שלבי כשתתבקש.',
        forceTotp: {
            description: 'אם מסומן, משתמש זה יידרש להגדיר ולהשתמש ב-TOTP.',
            label: 'אלץ TOTP'
        },
        setup: {
            addCodeManually: 'הוסף קוד ידנית',
            button: 'הגדר',
            description:
                'תצטרך אפליקציית אימות דו-שלבי כמו <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> כדי להשלים תהליך זה. לאחר התקנת אחת, סרוק את קוד ה-QR למטה לתוך האפליקציה שלך.',
            enterCode:
                'הזן את קוד האימות בן {digits} הספרות שנוצר על ידי האפליקציה שלך:',
            incorrectCode: 'קוד שגוי. אם השגיאה חוזרת, סרוק שוב את קוד ה-QR.',
            title: 'הגדרת אימות דו-שלבי',
        },
        verify: {
            title: 'אימות',
        },
    },
}; 

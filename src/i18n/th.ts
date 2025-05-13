import type { CustomTranslationsObject } from "./types.js";

export const th: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'แอปยืนยันตัวตน',
        configured: 'ตั้งค่าแล้ว',
        errors: {
            alreadySet: 'คุณได้ตั้งค่า TOTP ไว้แล้ว',
        },
        fieldDescription:
            'ใช้แอปยืนยันตัวตนหรือส่วนขยายเบราว์เซอร์เพื่อรับรหัสยืนยันตัวตนแบบสองขั้นตอนเมื่อมีการร้องขอ',
        forceTotp: {
            description: 'หากเลือกช่องนี้ ผู้ใช้จะต้องตั้งค่าและใช้ TOTP',
            label: 'บังคับใช้ TOTP'
        },
        setup: {
            addCodeManually: 'เพิ่มรหัสด้วยตนเอง',
            button: 'ตั้งค่า',
            description:
                'คุณจะต้องมีแอปยืนยันตัวตนแบบสองขั้นตอน เช่น <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> เพื่อดำเนินการให้เสร็จสิ้น หลังจากติดตั้งแล้ว ให้สแกนรหัส QR ด้านล่างลงในแอปพลิเคชันของคุณ',
            enterCode:
                'กรอกรหัสยืนยันตัวตน {digits} หลักที่สร้างโดยแอปของคุณ:',
            incorrectCode: 'รหัสไม่ถูกต้อง หากเกิดข้อผิดพลาดนี้ซ้ำ ให้สแกนรหัส QR ใหม่อีกครั้ง',
            title: 'ตั้งค่าการยืนยันตัวตนแบบสองขั้นตอน',
        },
        verify: {
            title: 'การยืนยัน',
        },
    },
}; 

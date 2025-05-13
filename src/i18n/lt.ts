import type { CustomTranslationsObject } from "./types.js";

export const lt: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'Autentifikacijos programa',
        configured: 'Sukonfigūruota',
        errors: {
            alreadySet: 'Jau turite nustatytą TOTP.',
        },
        fieldDescription:
            'Naudokite autentifikacijos programą arba naršyklės plėtinį, kad gautumėte dviejų faktorių autentifikacijos kodus, kai būsite paprašytas.',
        forceTotp: {
            description: 'Jei pažymėta, šis vartotojas turės nustatyti ir naudoti TOTP.',
            label: 'Priverstinis TOTP'
        },
        setup: {
            addCodeManually: 'Pridėti kodą rankiniu būdu',
            button: 'Nustatyti',
            description:
                'Jums reikės dviejų faktorių autentifikacijos programos, tokios kaip <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a>, kad užbaigtumėte šį procesą. Įdiegus programą, nuskaitykite žemiau esantį QR kodą į savo programą.',
            enterCode:
                'Įveskite {digits}-skaitmenį autentifikacijos kodą, kurį sugeneravo jūsų programa:',
            incorrectCode: 'Neteisingas kodas. Jei ši klaida kartojasi, iš naujo nuskaitykite QR kodą.',
            title: 'Dviejų faktorių autentifikacijos nustatymas',
        },
        verify: {
            title: 'Patikrinimas',
        },
    },
}; 

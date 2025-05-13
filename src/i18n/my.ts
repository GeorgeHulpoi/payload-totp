import type { CustomTranslationsObject } from "./types.js";

export const my: CustomTranslationsObject = {
    totpPlugin: {
        authApp: 'အတည်ပြုအက်ပ်လီကေးရှင်း',
        configured: 'ပြင်ဆင်ပြီး',
        errors: {
            alreadySet: 'သင့်တွင် TOTP သတ်မှတ်ထားပြီးဖြစ်သည်။',
        },
        fieldDescription:
            'တောင်းဆိုသောအခါ နှစ်ဆင့်အတည်ပြုရန် ကုဒ်များရယူရန် အတည်ပြုအက်ပ်လီကေးရှင်း သို့မဟုတ် ဘရောက်ဆာတိုးချဲ့မှုကို အသုံးပြုပါ။',
        forceTotp: {
            description: 'အကယ်၍ အမှန်ခြစ်ထားပါက၊ ဤအသုံးပြုသူသည် TOTP ကို ​​သတ်မှတ်ပြီး အသုံးပြုရန် လိုအပ်မည်ဖြစ်သည်။',
            label: 'TOTP ကို ​​အတင်းအကျပ်ပြုလုပ်ပါ။'
        },
        setup: {
            addCodeManually: 'ကုဒ်ကို လက်ဖြင့်ထည့်သွင်းပါ',
            button: 'ပြင်ဆင်ရန်',
            description:
                'ဤလုပ်ငန်းစဉ်ကို ပြီးဆုံးရန် <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> ကဲ့သို့သော နှစ်ဆင့်အတည်ပြုရန် အက်ပ်လီကေးရှင်းတစ်ခု လိုအပ်ပါသည်။ တစ်ခုကို ထည့်သွင်းပြီးနောက်၊ အောက်ပါ QR ကုဒ်ကို သင့်အက်ပ်လီကေးရှင်းထဲသို့ စကင်ဖတ်ပါ။',
            enterCode:
                'သင့်အက်ပ်မှ ထုတ်လုပ်သော {digits}-လုံးပါ အတည်ပြုကုဒ်ကို ထည့်သွင်းပါ:',
            incorrectCode: 'မှားယွင်းသောကုဒ်။ ဤအမှားက ထပ်ခါထပ်ခါ ဖြစ်ပါက QR ကို ပြန်လည်စကင်ဖတ်ပါ။',
            title: 'နှစ်ဆင့်အတည်ပြုရန် ပြင်ဆင်ခြင်း',
        },
        verify: {
            title: 'အတည်ပြုခြင်း',
        },
    },
}; 

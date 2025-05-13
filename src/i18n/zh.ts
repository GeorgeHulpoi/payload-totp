import type { CustomTranslationsObject } from "./types.js";

export const zh: CustomTranslationsObject = {
    totpPlugin: {
        authApp: '身份验证器应用',
        configured: '已配置',
        errors: {
            alreadySet: '您已经设置了 TOTP。',
        },
        fieldDescription:
            '在需要时使用身份验证应用或浏览器扩展获取双因素认证码。',
        forceTotp: {
            description: '如果选中此框，则该用户将被要求设置并使用TOTP。',
            label: '强制启用TOTP'
        },
        setup: {
            addCodeManually: '手动添加代码',
            button: '设置',
            description:
                '您需要安装双因素身份验证应用，例如 <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="nofollow noopener noreferrer">Google Authenticator</a> 来完成此过程。安装后，请扫描下方的二维码到您的应用中。',
            enterCode:
                '请输入您的应用生成的 {digits} 位验证码：',
            incorrectCode: '验证码错误。如果此错误重复出现，请重新扫描二维码。',
            title: '设置双因素身份验证',
        },
        verify: {
            title: '验证',
        },
    },
}; 

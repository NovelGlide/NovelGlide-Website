enum SupportedLocales {
  en = 'en',
  zhTW = 'zh-tw',
  zhCN = 'zh-cn',
  ja = 'ja',
}

export const supportedLocales: string[] = Object.values(SupportedLocales);
export const defaultLocale = supportedLocales[0];
export default SupportedLocales;
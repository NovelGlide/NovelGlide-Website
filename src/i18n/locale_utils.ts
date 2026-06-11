export class LocaleUtils {
  static mapToResourceLocale(locale: string): string {
    switch (locale) {
      case 'zh-tw':
        return 'zh-Hant-TW';
      case 'zh-cn':
        return 'zh-Hans-CN';
    }

    return locale;
  }

  static getManualUrl(folderUrl: string, locale: string): string {
    const resourceLocale = this.mapToResourceLocale(locale);
    return `https://novelglide-cdn.kai-wu.net/${folderUrl}/${resourceLocale}.md`;
  }
};
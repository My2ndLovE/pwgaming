import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import { join } from 'path';

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'vi', 'th'],
    preload: ['en', 'vi', 'th'],
    ns: ['common', 'errors'],
    defaultNS: 'common',
    backend: {
      loadPath: join(__dirname, 'locales/{{lng}}/{{ns}}.json'),
    },
  });

export default i18next;

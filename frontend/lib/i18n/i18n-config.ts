import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import all locale files
import commonEn from '@/public/locales/en/common.json';
import authEn from '@/public/locales/en/auth.json';
import walletEn from '@/public/locales/en/wallet.json';
import adminEn from '@/public/locales/en/admin.json';
import gameEn from '@/public/locales/en/game.json';
import errorsEn from '@/public/locales/en/errors.json';

import commonVi from '@/public/locales/vi/common.json';
import authVi from '@/public/locales/vi/auth.json';
import walletVi from '@/public/locales/vi/wallet.json';
import adminVi from '@/public/locales/vi/admin.json';
import gameVi from '@/public/locales/vi/game.json';
import errorsVi from '@/public/locales/vi/errors.json';

import commonTh from '@/public/locales/th/common.json';
import authTh from '@/public/locales/th/auth.json';
import walletTh from '@/public/locales/th/wallet.json';
import adminTh from '@/public/locales/th/admin.json';
import gameTh from '@/public/locales/th/game.json';
import errorsTh from '@/public/locales/th/errors.json';

const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    wallet: walletEn,
    admin: adminEn,
    game: gameEn,
    errors: errorsEn,
  },
  vi: {
    common: commonVi,
    auth: authVi,
    wallet: walletVi,
    admin: adminVi,
    game: gameVi,
    errors: errorsVi,
  },
  th: {
    common: commonTh,
    auth: authTh,
    wallet: walletTh,
    admin: adminTh,
    game: gameTh,
    errors: errorsTh,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'wallet', 'admin', 'game', 'errors'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

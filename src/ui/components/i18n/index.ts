import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import config from './config';

// Import translation files directly
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enSettings from './locales/en/settings.json';

import viCommon from './locales/vi/common.json';
import viHome from './locales/vi/home.json';
import viSettings from './locales/vi/settings.json';

// Get saved language preference if available
let savedLanguage = config.defaultLanguage;
try {
  const storedLanguage = localStorage.getItem('preferredLanguage');
  if (storedLanguage && config.supportedLanguages.includes(storedLanguage)) {
    savedLanguage = storedLanguage;
  }
} catch (e) {
  // In case localStorage is not available (e.g., in SSR)
  console.warn('Could not access localStorage for language preferences');
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        home: enHome,
        settings: enSettings,
      },
      vi: {
        common: viCommon,
        home: viHome,
        settings: viSettings,
      },
    },
    lng: savedLanguage,
    fallbackLng: config.defaultLanguage,
    ns: config.namespaces,
    defaultNS: config.defaultNamespace,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false // This prevents issues during rendering
    }
  });

export default i18n;
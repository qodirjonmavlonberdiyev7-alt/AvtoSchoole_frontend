import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
      en: { translation: en },
    },
    lng: 'uz',
    fallbackLng: 'uz',
    supportedLngs: ['uz', 'ru', 'en'],
    interpolation: { escapeValue: false },
    detection: {
      // Only ever switch away from Uzbek if the user explicitly picked another
      // language via the in-app switcher (persisted here) - never infer it from
      // the browser/OS locale, so the app defaults to Uzbek for every visitor.
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ui.language',
    },
  });

export default i18n;

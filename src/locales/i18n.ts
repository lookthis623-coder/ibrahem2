import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import arCommon from './ar/common.json'

i18n.use(initReactI18next).init({
  resources: {
    ar: arCommon,
  },
  lng: 'ar',
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n

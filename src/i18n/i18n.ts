import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import onboardingEn from './locales/en/onboarding.json'
import onboardingVi from './locales/vi/onboarding.json'
import onboardingJp from './locales/jp/onboarding.json'

import profileEn from './locales/en/profile.json'
import profileVi from './locales/vi/profile.json'
import profileJp from './locales/jp/profile.json'

import navEn from './locales/en/nav.json'
import navVi from './locales/vi/nav.json'
import navJp from './locales/jp/nav.json'

// ─── i18n Configuration ───────────────────────────────────────────────────────
// Default language: English
// Supported languages: en, vi, jp
// ──────────────────────────────────────────────────────────────────────────────

const resources = {
  en: {
    onboarding: onboardingEn,
    profile: profileEn,
    nav: navEn,
  },
  vi: {
    onboarding: onboardingVi,
    profile: profileVi,
    nav: navVi,
  },
  jp: {
    onboarding: onboardingJp,
    profile: profileJp,
    nav: navJp,
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('app_language') || 'en',
  fallbackLng: 'en',
  ns: ['onboarding', 'profile', 'nav'],
  defaultNS: 'profile',
  interpolation: {
    escapeValue: false, // React already handles XSS
  },
})

export default i18n

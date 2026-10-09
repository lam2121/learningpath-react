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

import guideEn from './locales/en/guide.json'
import guideVi from './locales/vi/guide.json'
import guideJp from './locales/jp/guide.json'

import historyEn from './locales/en/history.json'
import historyVi from './locales/vi/history.json'
import historyJp from './locales/jp/history.json'

import homeEn from './locales/en/home.json'
import homeVi from './locales/vi/home.json'
import homeJp from './locales/jp/home.json'

// ─── i18n Configuration ───────────────────────────────────────────────────────
// Default language: English
// Supported languages: en, vi, jp
// ──────────────────────────────────────────────────────────────────────────────

const resources = {
  en: {
    onboarding: onboardingEn,
    profile: profileEn,
    nav: navEn,
    guide: guideEn,
    history: historyEn,
    home: homeEn,
  },
  vi: {
    onboarding: onboardingVi,
    profile: profileVi,
    nav: navVi,
    guide: guideVi,
    history: historyVi,
    home: homeVi,
  },
  jp: {
    onboarding: onboardingJp,
    profile: profileJp,
    nav: navJp,
    guide: guideJp,
    history: historyJp,
    home: homeJp,
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('app_language') || 'en',
  fallbackLng: 'en',
  ns: ['onboarding', 'profile', 'nav', 'guide', 'history', 'home'],
  defaultNS: 'profile',
  interpolation: {
    escapeValue: false, // React already handles XSS
  },
})

export default i18n

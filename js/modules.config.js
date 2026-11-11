/**
 * EasyHealth — Modular Facility & Subsystem Registry
 * Designed for distributed team development: register new modules here to integrate them.
 */

(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.EasyHealthModules = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // SVG Icons matching Map Explorer aesthetic
  const ICONS = {
    hospital: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 9h6M9 13h6M12 7v8"/></svg>`,
    ambulance: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10H8v7h1M10 17H5a2 2 0 01-2-2V7a2 2 0 012-2h7v9M14 6h2l3 3v1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M9 8h4M11 6v4"/></svg>`,
    capsule: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.5 20.5l10-10a4.95 4.95 0 10-7-7l-10 10a4.95 4.95 0 107 7z"/><path d="M8.5 8.5l7 7"/></svg>`,
    microscope: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 18h12M10 22h4M9 2v6l-5 9a2 2 0 001.7 3h16.6a2 2 0 001.7-3l-5-9V2H9z"/></svg>`,
    bloodDrop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`,
    mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    stethoscope: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4.5 3v5a4.5 4.5 0 009 0V3M18 10a4 4 0 01-4 4 4 4 0 01-4-4M9 17.5a3.5 3.5 0 007 0V15"/><circle cx="18" cy="10" r="2"/></svg>`,
    fileText: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    phoneCall: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94m-1 7.98v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7.5"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    locate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>`,
    arrowUpRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>`
  };

  // Quick Service Category Chips (Mirrors Map Explorer Filters)
  const CATEGORY_CHIPS = [
    {
      id: 'HOSPITAL',
      label: { en: 'Hospitals', bn: 'হাসপাতাল' },
      icon: 'hospital',
      colorClass: 'chip-blue',
      route: 'map.html?category=HOSPITAL'
    },
    {
      id: 'EMERGENCY',
      label: { en: 'Emergency 999', bn: 'জরুরি ৯৯৯' },
      icon: 'ambulance',
      colorClass: 'chip-crimson',
      route: 'emergency.html'
    },
    {
      id: 'PHARMACY',
      label: { en: 'Pharmacies', bn: 'ফার্মেসি' },
      icon: 'capsule',
      colorClass: 'chip-green',
      route: 'map.html?category=PHARMACY'
    },
    {
      id: 'DIAGNOSTIC',
      label: { en: 'Diagnostics', bn: 'ডায়াগনস্টিক' },
      icon: 'microscope',
      colorClass: 'chip-purple',
      route: 'map.html?category=DIAGNOSTIC'
    },
    {
      id: 'BLOOD_BANK',
      label: { en: 'Blood Banks', bn: 'ব্লাড ব্যাংক' },
      icon: 'bloodDrop',
      colorClass: 'chip-rose',
      route: 'map.html?category=BLOOD_BANK'
    }
  ];

  // Core Modular Subsystems (Grow incrementally as teams build)
  const MODULES = [
    {
      id: 'emergency',
      title: { en: 'Emergency Support & SOS', bn: 'জরুরি সেবা ও ৯৯৯' },
      subtitle: {
        en: 'Direct 999 dialing, verified ambulance triage, and casualty records.',
        bn: 'জাতীয় জরুরি কল, অ্যাম্বুলেন্স প্রস্তুতি ও রোগী বিবরণ প্রস্তুত।'
      },
      icon: 'ambulance',
      path: 'emergency.html',
      status: 'ACTIVE',
      badge: { en: 'Active Beta', bn: 'চালু রয়েছে' },
      badgeType: 'badge-crimson',
      team: 'Emergency Team',
      directDial: '999'
    },
    {
      id: 'map',
      title: { en: 'Clinical Map Explorer', bn: 'স্বাস্থ্যসেবা ম্যাপ ও হাসপাতাল' },
      subtitle: {
        en: 'Interactive MapLibre facility locator for hospitals, 24/7 pharmacies, and ICU beds.',
        bn: 'খুলনা ও আশেপাশের যাচাইকৃত হাসপাতাল, ফার্মেসি ও আইসিইউ ম্যাপ।'
      },
      icon: 'mapPin',
      path: 'map.html',
      status: 'ACTIVE',
      badge: { en: 'Active Beta', bn: 'চালু রয়েছে' },
      badgeType: 'badge-blue',
      team: 'Geospatial Team'
    },
    {
      id: 'doctors',
      title: { en: 'Doctor Consultations', bn: 'ডাক্তার অ্যাপয়েন্টমেন্ট' },
      subtitle: {
        en: 'Specialist discovery, verified BMDC registration, and chamber schedule booking.',
        bn: 'বিশেষজ্ঞ চিকিৎসক খুঁজুন ও চেম্বারের সময়সূচী দেখে সরাসরি বুক করুন।'
      },
      icon: 'stethoscope',
      path: 'appointments/index.html',
      status: 'PLANNED',
      badge: { en: 'Phase 2', bn: 'পরিকল্পনাধীন' },
      badgeType: 'badge-muted',
      team: 'Clinical Team'
    },
    {
      id: 'records',
      title: { en: 'Medical Records & EHR', bn: 'মেডিকেল রেকর্ড ও প্রেসক্রিপশন' },
      subtitle: {
        en: 'Encrypted prescriptions archive, diagnostic reports, and medical history.',
        bn: 'প্রেসক্রিপশন ও টেস্ট রিপোর্ট ডিজিটাল উপায়ে নিরাপদ সংরক্ষণ।'
      },
      icon: 'fileText',
      path: 'records/index.html',
      status: 'PLANNED',
      badge: { en: 'Phase 4', bn: 'পরিকল্পনাধীন' },
      badgeType: 'badge-muted',
      team: 'Records Team'
    }
  ];

  return {
    ICONS,
    CATEGORY_CHIPS,
    MODULES
  };
});

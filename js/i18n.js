/**
 * EasyHealth — Universal i18n & Localization Engine
 * Provides seamless cross-page, cross-frame, and cross-tab language synchronization.
 */

(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.EasyHealthI18n = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'easyhealth_lang';
  const LEGACY_STORAGE_KEY = 'sastho_emergency_language';

  const TRANSLATIONS = {
    en: {
      // Header & Global Navigation
      brandTitle: "EasyHealth · স্বাস্থ্য-সহজ",
      brandSubtitle: "Clinical Healthcare Portal",
      navHome: "Home",
      navMap: "Clinical Map",
      navEmergency: "Emergency Support",
      call999: "SOS 999",

      // Landing Hub
      heroBadge: "Verified Clinical Directory · Khulna Corridor",
      heroTitle: "Clinical Health Hub",
      heroSubtitle: "Fast, accessible healthcare directory and emergency medical services",
      searchPlaceholder: "Search hospitals, 24/7 pharmacies, diagnostics...",
      modulesHeading: "Healthcare Facilities & Modules",
      modulesSubtitle: "Integrated clinical services",
      tabMap: "Clinical Map Radar",
      tabEmergency: "Emergency & SOS Hotline",
      openFullScreen: "Open Full Screen",
      contributorTitle: "Building a New Facility or Service?",
      contributorDesc: "EasyHealth is modular. Create your feature folder and register it in js/modules.config.js.",
      contributorAction: "View Contributor Guide →",
      footerStatus: "Production Active",
      footerDisclaimer: "In case of a life-threatening medical emergency, call 999 directly.",
      openService: "Launch Service",
      plannedNotice: "Planned · Phase Roadmap",

      // Map Explorer & Controls
      mapSearchPlaceholder: "Search hospitals, specialists, clinics...",
      filterHospitals: "Hospitals",
      filterPharmacies: "Pharmacies",
      filterDiagnostics: "Diagnostics",
      filterBlood: "Blood Banks",
      dockHospitals: "Medical Facilities",
      dockLocate: "Detect Current GPS Location",
      dockHelplines: "24/7 Emergency & Medical Helplines",
      dockCategories: "Medical Categories",
      dockSettings: "Map Provider Settings",
      dockCollapse: "Toggle Cards Panel",
      btnDirections: "Directions",
      statusOpen247: "24/7 Open",
      statusOpenNow: "Open now",
      statusEmergency: "Emergency",
      unitMetersAway: "m away",
      unitKmAway: "km away",
      yourLocation: "Your Current Location",

      // Helplines Modal (Map)
      helplinesModalTitle: "24/7 Verified Helplines",
      helplinesModalSubtitle: "Immediate emergency and medical assistance hotlines in Bangladesh",
      helplineNationalGroup: "National Emergency & Healthcare",
      helplineKhulnaGroup: "Khulna & Campus 24/7 Centers",
      btnCall: "Call",
      btnClose: "Close",

      // Location Modal (Map)
      locationModalTitle: "Enable Real Location Detection",
      locationModalDesc: "EasyHealth uses your current location to discover nearest verified hospitals, 24/7 pharmacies, ICU bed availability, and draw real-time navigation routes.",
      btnGrantLocation: "Share Precise GPS Location",
      btnDefaultLocation: "Continue with Default Location",

      // Settings Modal (Map)
      settingsModalTitle: "Map Provider Settings",
      settingsModalSubtitle: "Choose map layer source and configure API keys",
      lblTileProvider: "Tile Provider / Base Map",
      lblMapApiKey: "MapLibre / MapTiler API Key",
      btnSaveSettings: "Apply Provider",
      btnResetOsm: "Reset to OSM",

      // Emergency Portal (emergency.html)
      prototype: "Emergency support",
      mainSite: "Main website",
      eyebrow: "BANGLADESH · EMERGENCY HEALTH SUPPORT",
      headline: "The right help, faster when it matters",
      intro: "Choose the emergency service you need. For immediate danger, call the national emergency number directly.",
      safetyNote: "For life-threatening emergencies, do not wait for the app. Call 999 or go to the nearest emergency department. This frontend does not dispatch ambulances.",
      featureHelplines: "National emergency helplines",
      featureHelplinesSub: "Direct calls to government helplines",
      featureRadar: "Nearby medical services",
      featureRadarSub: "Find hospitals and services on the existing map",
      featureAmbulance: "Ambulance & hospital",
      featureAmbulanceSub: "View hospital, vehicle and driver information",
      featureCasualty: "Patient casualty information",
      featureCasualtySub: "Prepare injury photos and patient notes",
      back: "All options",
      searchHelpline: "Search helplines...",
      helplineFootnote: "Verify numbers and service descriptions against official sources before production.",
      sharedMapTitle: "Your project's existing medical map",
      sharedMapText: "The map loads directly from the map explorer. No duplicate copy is created.",
      reloadMap: "Reload map",
      mapWaiting: "Waiting for map connection...",
      mapConnected: "Connected to the existing map.",
      mapDisclaimer: "Verify facility details before relying on them.",
      selectHospitalMap: "Select a hospital on the map",
      selectHospitalMapSub: "The selected facility and available information will appear here.",
      providerNoticeTitle: "Provider integration required",
      providerNotice: "Ambulance and driver entries shown here are not bookable. A verified ambulance operator must be integrated before real bookings.",
      chooseHospital: "Choose a hospital",
      ambulanceOptions: "Ambulance type",
      driverDetails: "Driver & vehicle information",
      demoOnly: "Demo information",
      driverNotAssigned: "No verified driver is assigned. Once an operator is connected, driver identity, licence verification, phone and vehicle registration can appear here.",
      hospitalMapHint: "Choose a hospital in Medical Help Radar or select one from the list below.",
      dispatchSafety: "For urgent transport, call 999 or contact a verified local ambulance provider directly.",
      requestAmbulance: "Request ambulance booking",
      uploadTitle: "Upload injury photos",
      uploadSub: "JPEG, PNG or WebP · Up to 5 photos · 10 MB each",
      noPhotos: "No photos selected",
      casualtyNotesTitle: "Patient condition & emergency information",
      casualtyNotesSub: "Describe symptoms, injury location, how it happened and other information clinicians should know.",
      casualtyPlaceholder: "Describe the patient's current condition and injuries...",
      privacyNote: "This preview does not send data to a server. Secure hospital APIs and authorization are required before transmitting sensitive photos or information.",
      prepareInfo: "Prepare information",
      footerText: "Emergency support · Integrated Frontend",
      viewHelplines: "National emergency helplines",
      viewHelplinesDesc: "Choose the service you need and call directly.",
      viewRadar: "Nearby medical services",
      viewRadarDesc: "Find hospitals, pharmacies, diagnostics and blood banks on the map.",
      viewAmbulance: "Ambulance & hospital",
      viewAmbulanceDesc: "Review hospital information and ambulance types.",
      viewCasualty: "Patient casualty information",
      viewCasualtyDesc: "Enter only photos and a description of the patient's condition/injuries.",
      hospital: "Hospital",
      pharmacy: "Pharmacy",
      diagnostic: "Diagnostic",
      blood: "Blood bank",
      address: "Address",
      phone: "Phone",
      distance: "Distance",
      facilityInfo: "Facility information",
      unknown: "Not verified",
      basic: "Basic ambulance",
      bls: "Basic life support (BLS)",
      als: "Advanced life support (ALS)",
      basicDesc: "General patient transport; equipment varies by operator.",
      blsDesc: "Trained support and basic life-support equipment—must be confirmed by provider.",
      alsDesc: "Advanced monitoring/life-support—must be confirmed by provider.",
      noFacility: "No hospital information has been received from the map.",
      photoLimit: "Select no more than 5 photos.",
      photoInvalid: "Each photo must be JPEG, PNG or WebP and no larger than 10 MB.",
      casualtyReady: "Information validated. It is prepared in this browser only; it has not been sent to a hospital.",
      selectHospitalFirst: "Choose a hospital first.",
      selectAmbulanceFirst: "Choose an ambulance type first.",
      notBookable: "Real booking is not enabled. A verified ambulance operator and booking API are required.",
      selected: "Selected",
      noPhone: "No phone number provided",
      hospitalSelected: "Hospital selected"
    },
    bn: {
      // Header & Global Navigation
      brandTitle: "স্বাস্থ্য-সহজ · EasyHealth",
      brandSubtitle: "ক্লিনিক্যাল স্বাস্থ্যসেবা পোর্টাল",
      navHome: "হোম",
      navMap: "স্বাস্থ্যসেবা ম্যাপ",
      navEmergency: "জরুরি সেবা",
      call999: "জরুরি ৯৯৯",

      // Landing Hub
      heroBadge: "যাচাইকৃত স্বাস্থ্যসেবা কেন্দ্র · খুলনা করিডোর",
      heroTitle: "ক্লিনিক্যাল হেলথ হাব",
      heroSubtitle: "দ্রুত ও সহজে স্বাস্থ্যসেবা ও জরুরি চিকিৎসা সহায়তার সমন্বিত প্ল্যাটফর্ম",
      searchPlaceholder: "হাসপাতাল, ২৪/৭ ফার্মেসি, ডায়াগনস্টিক সেন্টার খুঁজুন...",
      modulesHeading: "স্বাস্থ্যসেবা ও মডিউলসমূহ",
      modulesSubtitle: "সমন্বিত ক্লিনিক্যাল সেবাসমূহ",
      tabMap: "ক্লিনিক্যাল ম্যাপ রাডার",
      tabEmergency: "জরুরি সেবা ও ৯৯৯ হটলাইন",
      openFullScreen: "পূর্ণ পর্দায় দেখুন",
      contributorTitle: "নতুন কোনো সেবা বা ফিচার যুক্ত করতে চান?",
      contributorDesc: "স্বাস্থ্য-সহজ মডুলার। নিজস্ব ফোল্ডারে কাজ করে js/modules.config.js ফাইলে যুক্ত করুন।",
      contributorAction: "কন্ট্রিবিউটর গাইড দেখুন →",
      footerStatus: "সক্রিয় সিস্টেম",
      footerDisclaimer: "জীবন-ঝুঁকিপূর্ণ জরুরি পরিস্থিতিতে অবিলম্বে ৯৯৯ নম্বরে সরাসরি কল করুন।",
      openService: "সেবা চালু করুন",
      plannedNotice: "পরিকল্পনাধীন · রোডম্যাপ",

      // Map Explorer & Controls
      mapSearchPlaceholder: "হাসপাতাল, বিশেষজ্ঞ, ক্লিনিক খুঁজুন...",
      filterHospitals: "হাসপাতাল",
      filterPharmacies: "ফার্মেসি",
      filterDiagnostics: "ডায়াগনস্টিক",
      filterBlood: "ব্লাড ব্যাংক",
      dockHospitals: "নিকটস্থ স্বাস্থ্যসেবা",
      dockLocate: "বর্তমান জিপিএস লোকেশন",
      dockHelplines: "২৪/৭ জরুরি ও মেডিকেল হেল্পলাইন",
      dockCategories: "সেবা ক্যাটাগরি",
      dockSettings: "ম্যাপ সেটিংস ও প্রোভাইডার",
      dockCollapse: "কার্ড প্যানেল টগল করুন",
      btnDirections: "দিকনির্দেশনা",
      statusOpen247: "২৪/৭ খোলা",
      statusOpenNow: "এখন খোলা",
      statusEmergency: "জরুরি সেবা",
      unitMetersAway: "মিটার দূরে",
      unitKmAway: "কিমি দূরে",
      yourLocation: "আপনার বর্তমান অবস্থান",

      // Helplines Modal (Map)
      helplinesModalTitle: "২৪/৭ যাচাইকৃত হেল্পলাইন",
      helplinesModalSubtitle: "বাংলাদেশে তাত্ক্ষণিক জরুরি ও স্বাস্থ্যসেবা সহায়তা নম্বর",
      helplineNationalGroup: "জাতীয় জরুরি ও স্বাস্থ্যসেবা",
      helplineKhulnaGroup: "খুলনা ও ক্যাম্পাস ২৪/৭ কেন্দ্রসমূহ",
      btnCall: "কল করুন",
      btnClose: "বন্ধ করুন",

      // Location Modal (Map)
      locationModalTitle: "বাস্তব লোকেশন শনাক্তকরণ চালু করুন",
      locationModalDesc: "স্বাস্থ্য-সহজ আপনার কাছাকাছি যাচাইকৃত হাসপাতাল, ২৪/৭ ফার্মেসি, আইসিইউ বেড এবং রিয়েল-টাইম নেভিগেশন রুট দেখাতে বর্তমান লোকেশন ব্যবহার করে।",
      btnGrantLocation: "বর্তমান জিপিএস লোকেশন শেয়ার করুন",
      btnDefaultLocation: "ডিফল্ট লোকেশন দিয়ে চালিয়ে যান",

      // Settings Modal (Map)
      settingsModalTitle: "ম্যাপ প্রোভাইডার সেটিংস",
      settingsModalSubtitle: "ম্যাপ লেয়ার সোর্স ও এপিআই কি নির্ধারণ করুন",
      lblTileProvider: "টাইল প্রোভাইডার / বেস ম্যাপ",
      lblMapApiKey: "ম্যাপলিব্রে / ম্যাপটায়লার এপিআই কি",
      btnSaveSettings: "প্রোভাইডার প্রয়োগ করুন",
      btnResetOsm: "ওএসএম-এ রিসেট করুন",

      // Emergency Portal (emergency.html)
      prototype: "সেবা সহায়তা",
      mainSite: "মূল ওয়েবসাইট",
      eyebrow: "বাংলাদেশ · জরুরি স্বাস্থ্য সহায়তা",
      headline: "জরুরি মুহূর্তে সঠিক সহায়তা, দ্রুত",
      intro: "প্রয়োজনীয় জরুরি সেবা বেছে নিন। তাৎক্ষণিক জীবন-ঝুঁকিপূর্ণ বিপদে সরাসরি উপরে ৯৯৯-এ কল করুন।",
      safetyNote: "জীবন-ঝুঁকিপূর্ণ জরুরি অবস্থায় অ্যাপের অপেক্ষা না করে ৯৯৯-এ কল করুন বা নিকটস্থ জরুরি বিভাগে যান। এই ফ্রন্টএন্ড নিজে থেকে অ্যাম্বুলেন্স পাঠায় না।",
      featureHelplines: "জাতীয় জরুরি হেল্পলাইন",
      featureHelplinesSub: "সরকারি জরুরি নম্বরে সরাসরি কল",
      featureRadar: "কাছাকাছি চিকিৎসা সেবা",
      featureRadarSub: "বিদ্যমান ম্যাপে হাসপাতাল ও সেবা খুঁজুন",
      featureAmbulance: "অ্যাম্বুলেন্স ও হাসপাতাল",
      featureAmbulanceSub: "হাসপাতাল, গাড়ি ও চালকের তথ্য দেখুন",
      featureCasualty: "রোগীর জরুরি তথ্য",
      featureCasualtySub: "আঘাতের ছবি ও রোগীর বিবরণ প্রস্তুত করুন",
      back: "সব অপশন",
      searchHelpline: "হেল্পলাইন খুঁজুন...",
      helplineFootnote: "ব্যবহারের আগে সরকারি সূত্র থেকে নম্বর ও সেবার তথ্য যাচাই করুন।",
      sharedMapTitle: "আপনার প্রকল্পের বিদ্যমান স্বাস্থ্যসেবা ম্যাপ",
      sharedMapText: "ম্যাপটি ম্যাপ এক্সপ্লোরার থেকে লোড হচ্ছে। কোনো ডুপ্লিকেট কপি তৈরি করা হয়নি।",
      reloadMap: "ম্যাপ রিফ্রেশ",
      mapWaiting: "ম্যাপের সাথে সংযোগের অপেক্ষায়...",
      mapConnected: "বিদ্যমান ম্যাপের সাথে সংযুক্ত।",
      mapDisclaimer: "ম্যাপের তালিকার তথ্য যাচাই করে ব্যবহার করুন।",
      selectHospitalMap: "ম্যাপে একটি হাসপাতাল নির্বাচন করুন",
      selectHospitalMapSub: "নির্বাচিত প্রতিষ্ঠানের নাম ও উপলব্ধ তথ্য এখানে দেখানো হবে।",
      providerNoticeTitle: "প্রোভাইডার সংযোগ প্রয়োজন",
      providerNotice: "এখানে প্রদর্শিত নমুনা অ্যাম্বুলেন্স/চালক বুকিংয়ের জন্য উপলব্ধ নয়। বাস্তব বুকিংয়ের আগে যাচাইকৃত অ্যাম্বুলেন্স অপারেটর যুক্ত করতে হবে।",
      chooseHospital: "হাসপাতাল নির্বাচন",
      ambulanceOptions: "অ্যাম্বুলেন্সের ধরন",
      driverDetails: "চালক ও গাড়ির তথ্য",
      demoOnly: "ডেমো তথ্য",
      driverNotAssigned: "এখনো কোনো যাচাইকৃত চালক বরাদ্দ নেই। অপারেটর সংযুক্ত হলে চালকের পরিচয়, লাইসেন্স যাচাই, ফোন ও গাড়ির নম্বর এখানে দেখানো হবে।",
      hospitalMapHint: "মেডিকেল হেল্প রাডার থেকে হাসপাতাল নির্বাচন করুন অথবা নিচের তালিকা দেখুন।",
      dispatchSafety: "জরুরি অবস্থায় অ্যাম্বুলেন্সের জন্য ৯৯৯ বা সরাসরি যাচাইকৃত স্থানীয় সেবায় যোগাযোগ করুন।",
      requestAmbulance: "অ্যাম্বুলেন্স বুকিং অনুরোধ",
      uploadTitle: "আঘাতের ছবি আপলোড করুন",
      uploadSub: "JPEG, PNG বা WebP · সর্বোচ্চ ৫টি ছবি · প্রতিটি ১০ MB পর্যন্ত",
      noPhotos: "কোনো ছবি নির্বাচন করা হয়নি",
      casualtyNotesTitle: "রোগীর অবস্থা ও জরুরি তথ্য",
      casualtyNotesSub: "লক্ষণ, আঘাতের স্থান, কীভাবে আঘাত লেগেছে এবং চিকিৎসকের জানা জরুরি তথ্য লিখুন।",
      casualtyPlaceholder: "রোগীর বর্তমান অবস্থা ও আঘাতের বিবরণ লিখুন...",
      privacyNote: "এই প্রিভিউতে তথ্য সার্ভারে পাঠানো হয় না। সংবেদনশীল ছবি/তথ্য পাঠানোর আগে নিরাপদ হাসপাতাল API ও অনুমোদন ব্যবস্থা যুক্ত করতে হবে।",
      prepareInfo: "তথ্য প্রস্তুত করুন",
      footerText: "জরুরি সহায়তা · সমন্বিত ফ্রন্টএন্ড",
      viewHelplines: "জাতীয় জরুরি হেল্পলাইন",
      viewHelplinesDesc: "প্রয়োজনীয় সেবাটি বেছে সরাসরি কল করুন।",
      viewRadar: "কাছাকাছি চিকিৎসা সেবা",
      viewRadarDesc: "ম্যাপে হাসপাতাল, ফার্মেসি, ডায়াগনস্টিক ও ব্লাড ব্যাংক খুঁজুন।",
      viewAmbulance: "অ্যাম্বুলেন্স ও হাসপাতাল",
      viewAmbulanceDesc: "হাসপাতালের তথ্য দেখুন এবং অ্যাম্বুলেন্সের ধরন পর্যালোচনা করুন।",
      viewCasualty: "রোগীর জরুরি তথ্য",
      viewCasualtyDesc: "শুধু ছবি ও রোগীর অবস্থা/আঘাতের বিবরণ দিন।",
      hospital: "হাসপাতাল",
      pharmacy: "ফার্মেসি",
      diagnostic: "ডায়াগনস্টিক",
      blood: "ব্লাড ব্যাংক",
      address: "ঠিকানা",
      phone: "ফোন",
      distance: "দূরত্ব",
      facilityInfo: "প্রদর্শিত তথ্য",
      unknown: "যাচাই করা হয়নি",
      basic: "বেসিক অ্যাম্বুলেন্স",
      bls: "বেসিক লাইফ সাপোর্ট (BLS)",
      als: "অ্যাডভান্সড লাইফ সাপোর্ট (ALS)",
      basicDesc: "সাধারণ রোগী পরিবহন; চিকিৎসা সরঞ্জাম অপারেটরভেদে ভিন্ন।",
      blsDesc: "প্রশিক্ষিত সহায়তা ও প্রাথমিক জীবনরক্ষাকারী সরঞ্জাম—প্রোভাইডার দ্বারা নিশ্চিত করতে হবে।",
      alsDesc: "উন্নত পর্যবেক্ষণ/লাইফ-সাপোর্ট—প্রোভাইডার দ্বারা নিশ্চিত করতে হবে।",
      noFacility: "ম্যাপ থেকে কোনো হাসপাতাল তথ্য পাওয়া যায়নি।",
      photoLimit: "সর্বোচ্চ ৫টি ছবি নির্বাচন করুন।",
      photoInvalid: "প্রতিটি ছবি JPEG, PNG বা WebP এবং সর্বোচ্চ ১০ MB হতে হবে।",
      casualtyReady: "তথ্য যাচাই হয়েছে। এটি শুধু ব্রাউজারে প্রস্তুত করা হয়েছে; হাসপাতালে পাঠানো হয়নি।",
      selectHospitalFirst: "প্রথমে হাসপাতাল নির্বাচন করুন।",
      selectAmbulanceFirst: "অ্যাম্বুলেন্সের ধরন নির্বাচন করুন।",
      notBookable: "বাস্তব বুকিং চালু নেই। যাচাইকৃত অ্যাম্বুলেন্স অপারেটর ও বুকিং API যুক্ত করতে হবে।",
      selected: "নির্বাচিত",
      noPhone: "ফোন নম্বর দেওয়া নেই",
      hospitalSelected: "হাসপাতাল নির্বাচন করা হয়েছে"
    }
  };

  // State
  let currentLang = 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved === 'en' || saved === 'bn') {
      currentLang = saved;
      localStorage.setItem(STORAGE_KEY, saved);
    }
  } catch (err) {}

  const listeners = new Set();

  /**
   * Converts Western Arabic numerals to Bengali numerals
   */
  function toBengaliNumber(val) {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(val ?? '').replace(/[0-9]/g, d => bnDigits[d]);
  }

  /**
   * Retrieves translation for given key
   */
  function t(key, fallback = '') {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (dict && typeof dict[key] !== 'undefined') {
      return dict[key];
    }
    const enDict = TRANSLATIONS.en;
    if (enDict && typeof enDict[key] !== 'undefined') {
      return enDict[key];
    }
    return fallback || key;
  }

  /**
   * Updates DOM elements with data-i18n attributes
   */
  function updateDomTranslations() {
    document.documentElement.lang = currentLang;

    // Update segmented lang toggles
    document.querySelectorAll('.lang-opt').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      btn.classList.toggle('active', btnLang === currentLang);
    });

    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = t(key);
      if (text) {
        el.textContent = text;
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = t(key);
      if (text) {
        el.placeholder = text;
      }
    });

    // Translate title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const text = t(key);
      if (text) {
        el.title = text;
      }
    });

    // Translate aria-label attributes
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      const text = t(key);
      if (text) {
        el.setAttribute('aria-label', text);
      }
    });
  }

  /**
   * Core language setter with sync
   */
  function setLanguage(lang, sync = true) {
    if (lang !== 'en' && lang !== 'bn') return;
    currentLang = lang;

    try {
      localStorage.setItem(STORAGE_KEY, lang);
      localStorage.setItem(LEGACY_STORAGE_KEY, lang);
    } catch (err) {}

    updateDomTranslations();

    // Trigger local subscribers
    listeners.forEach(cb => {
      try {
        cb(lang);
      } catch (e) {
        console.error('i18n listener error:', e);
      }
    });

    // Dispatch DOM event
    try {
      window.dispatchEvent(new CustomEvent('easyhealth:langchange', { detail: { lang } }));
    } catch (e) {}

    if (sync) {
      // 1. Broadcast to child iframes
      document.querySelectorAll('iframe').forEach(frame => {
        try {
          frame.contentWindow.postMessage({
            type: 'SASTHO_SET_LANGUAGE',
            lang: lang
          }, '*');
        } catch (err) {}
      });

      // 2. Broadcast to parent window if embedded
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({
            type: 'SASTHO_SET_LANGUAGE',
            lang: lang
          }, '*');
        } catch (err) {}
      }
    }
  }

  /**
   * Subscribes to language changes
   */
  function onLanguageChange(callback) {
    if (typeof callback === 'function') {
      listeners.add(callback);
    }
  }

  /**
   * Initializes event listeners and attaches to DOM
   */
  function init() {
    updateDomTranslations();

    // Wire segmented button clicks (delegated or direct)
    document.addEventListener('click', e => {
      const btn = e.target.closest('.lang-opt');
      if (btn && btn.hasAttribute('data-lang')) {
        const lang = btn.getAttribute('data-lang');
        setLanguage(lang);
      }
    });

    // Cross-tab synchronization via storage event
    window.addEventListener('storage', e => {
      if (e.key === STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) {
        const newLang = e.newValue;
        if (newLang && (newLang === 'en' || newLang === 'bn') && newLang !== currentLang) {
          setLanguage(newLang, false);
        }
      }
    });

    // Cross-frame synchronization via postMessage
    window.addEventListener('message', e => {
      const msg = e.data || {};
      if (msg && msg.type === 'SASTHO_SET_LANGUAGE') {
        const newLang = msg.lang;
        if (newLang && (newLang === 'en' || newLang === 'bn') && newLang !== currentLang) {
          setLanguage(newLang, false);
        }
      }
    });
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    get currentLang() { return currentLang; },
    getCurrentLang: () => currentLang,
    setLanguage,
    t,
    translations: TRANSLATIONS,
    toBengaliNumber,
    onLanguageChange
  };
});

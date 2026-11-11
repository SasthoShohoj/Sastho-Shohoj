/**
 * EasyHealth — Landing Hub Controller
 * Handles localization, dynamic module rendering, category deep-links, and preview synchronization.
 */

(function () {
  'use strict';

  const STORAGE_KEY_LANG = 'easyhealth_lang';

  // State
  const state = {
    lang: (window.EasyHealthI18n ? window.EasyHealthI18n.getCurrentLang() : (localStorage.getItem(STORAGE_KEY_LANG) || 'en')),
    activePreview: 'map',
    searchQuery: '',
    selectedCategory: null
  };

  // Bilingual Dictionary
  const TRANSLATIONS = {
    en: {
      brandTitle: 'EasyHealth · স্বাস্থ্য-সহজ',
      brandSubtitle: 'Clinical Healthcare Portal',
      navHome: 'Home',
      navMap: 'Clinical Map',
      navEmergency: 'Emergency Support',
      call999: 'SOS 999',
      heroBadge: 'Verified Clinical Directory · Khulna Corridor',
      heroTitle: 'Clinical Health Hub',
      heroSubtitle: 'Fast, accessible healthcare directory and emergency medical services',
      searchPlaceholder: 'Search hospitals, 24/7 pharmacies, diagnostics...',
      modulesHeading: 'Healthcare Facilities & Modules',
      modulesSubtitle: 'Integrated clinical services',
      tabMap: 'Clinical Map Radar',
      tabEmergency: 'Emergency & SOS Hotline',
      openFullScreen: 'Open Full Screen',
      contributorTitle: 'Building a New Facility or Service?',
      contributorDesc: 'EasyHealth is modular. Create your feature folder and register it in js/modules.config.js.',
      contributorAction: 'View Contributor Guide →',
      footerStatus: 'Production Active',
      footerDisclaimer: 'In case of a life-threatening medical emergency, call 999 directly.',
      openService: 'Launch Service',
      plannedNotice: 'Planned · Phase Roadmap'
    },
    bn: {
      brandTitle: 'স্বাস্থ্য-সহজ · EasyHealth',
      brandSubtitle: 'ক্লিনিক্যাল স্বাস্থ্যসেবা পোর্টাল',
      navHome: 'হোম',
      navMap: 'স্বাস্থ্যসেবা ম্যাপ',
      navEmergency: 'জরুরি সেবা',
      call999: 'জরুরি ৯৯৯',
      heroBadge: 'যাচাইকৃত স্বাস্থ্যসেবা কেন্দ্র · খুলনা করিডোর',
      heroTitle: 'ক্লিনিক্যাল হেলথ হাব',
      heroSubtitle: 'দ্রুত ও সহজে স্বাস্থ্যসেবা ও জরুরি চিকিৎসা সহায়তার সমন্বিত প্ল্যাটফর্ম',
      searchPlaceholder: 'হাসপাতাল, ২৪/৭ ফার্মেসি, ডায়াগনস্টিক সেন্টার খুঁজুন...',
      modulesHeading: 'স্বাস্থ্যসেবা ও মডিউলসমূহ',
      modulesSubtitle: 'সমন্বিত ক্লিনিক্যাল সেবাসমূহ',
      tabMap: 'ক্লিনিক্যাল ম্যাপ রাডার',
      tabEmergency: 'জরুরি সেবা ও ৯৯৯ হটলাইন',
      openFullScreen: 'পূর্ণ পর্দায় দেখুন',
      contributorTitle: 'নতুন কোনো সেবা বা ফিচার যুক্ত করতে চান?',
      contributorDesc: 'স্বাস্থ্য-সহজ মডুলার। নিজস্ব ফোল্ডারে কাজ করে js/modules.config.js ফাইলে যুক্ত করুন।',
      contributorAction: 'কন্ট্রিবিউটর গাইড দেখুন →',
      footerStatus: 'সক্রিয় সিস্টেম',
      footerDisclaimer: 'জীবন-ঝুঁকিপূর্ণ জরুরি পরিস্থিতিতে অবিলম্বে ৯৯৯ নম্বরে সরাসরি কল করুন।',
      openService: 'সেবা চালু করুন',
      plannedNotice: 'পরিকল্পনাধীন · রোডম্যাপ'
    }
  };

  // DOM Elements
  const DOM = {
    btnLangEn: document.getElementById('btnLangEn'),
    btnLangBn: document.getElementById('btnLangBn'),
    categoryChipsRow: document.getElementById('categoryChipsRow'),
    launcherGrid: document.getElementById('launcherGrid'),
    globalSearchInput: document.getElementById('globalSearchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    btnDetectGps: document.getElementById('btnDetectGps'),
    tabMapPreview: document.getElementById('tabMapPreview'),
    tabEmergencyPreview: document.getElementById('tabEmergencyPreview'),
    previewFrame: document.getElementById('previewFrame'),
    previewExternalLink: document.getElementById('previewExternalLink')
  };

  /**
   * Translates text and updates UI
   */
  function setLanguage(lang) {
    state.lang = lang;
    if (window.EasyHealthI18n) {
      window.EasyHealthI18n.setLanguage(lang);
    } else {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
      document.documentElement.lang = lang;

      if (DOM.btnLangEn && DOM.btnLangBn) {
        DOM.btnLangEn.classList.toggle('active', lang === 'en');
        DOM.btnLangBn.classList.toggle('active', lang === 'bn');
      }

      const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.placeholder = dict[key];
      });
    }

    // Forward language to embedded preview frame
    if (DOM.previewFrame && DOM.previewFrame.contentWindow) {
      try {
        DOM.previewFrame.contentWindow.postMessage({
          type: 'SASTHO_SET_LANGUAGE',
          lang: lang
        }, '*');
      } catch (e) {}
    }

    // Re-render dynamic elements with current language
    renderCategoryChips();
    renderModules();
  }

  /**
   * Renders quick category icon chips
   */
  function renderCategoryChips() {
    if (!window.EasyHealthModules || !DOM.categoryChipsRow) return;

    const { CATEGORY_CHIPS, ICONS } = window.EasyHealthModules;
    DOM.categoryChipsRow.innerHTML = '';

    CATEGORY_CHIPS.forEach(chip => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `category-chip ${chip.colorClass || ''} ${state.selectedCategory === chip.id ? 'active' : ''}`;
      btn.setAttribute('data-category', chip.id);
      btn.setAttribute('data-route', chip.route);

      const iconSvg = ICONS[chip.icon] || '';
      const label = chip.label[state.lang] || chip.label.en;

      btn.innerHTML = `${iconSvg}<span>${label}</span>`;

      btn.addEventListener('click', () => {
        handleCategoryClick(chip);
      });

      DOM.categoryChipsRow.appendChild(btn);
    });
  }

  /**
   * Handles clicking a category chip
   */
  function handleCategoryClick(chip) {
    // If emergency chip, switch preview to emergency or navigate
    if (chip.id === 'EMERGENCY') {
      switchPreview('emergency');
      return;
    }

    // Toggle category selection
    state.selectedCategory = state.selectedCategory === chip.id ? null : chip.id;

    // Update active state in chip buttons
    document.querySelectorAll('.category-chip').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-category') === state.selectedCategory);
    });

    // Ensure map preview is active
    if (state.activePreview !== 'map') {
      switchPreview('map');
    }

    // Send filter message to map iframe if available, or update src
    const mapSrc = state.selectedCategory
      ? `map/index.html?embed=preview&category=${encodeURIComponent(state.selectedCategory)}`
      : 'map/index.html?embed=preview';

    if (DOM.previewFrame && state.activePreview === 'map') {
      try {
        DOM.previewFrame.contentWindow.postMessage({
          type: 'SASTHO_MAP_FILTER_CATEGORY',
          category: state.selectedCategory
        }, '*');
      } catch (err) {}
      DOM.previewFrame.src = mapSrc;
    }

    // Update external link with category parameter
    if (DOM.previewExternalLink) {
      DOM.previewExternalLink.href = state.selectedCategory
        ? `map/index.html?category=${encodeURIComponent(state.selectedCategory)}`
        : 'map/index.html';
    }
  }

  /**
   * Renders modular facility launcher cards
   */
  function renderModules() {
    if (!window.EasyHealthModules || !DOM.launcherGrid) return;

    const { MODULES, ICONS } = window.EasyHealthModules;
    DOM.launcherGrid.innerHTML = '';

    const q = (state.searchQuery || '').trim().toLowerCase();

    MODULES.forEach(mod => {
      const title = mod.title[state.lang] || mod.title.en;
      const subtitle = mod.subtitle[state.lang] || mod.subtitle.en;
      const badge = mod.badge[state.lang] || mod.badge.en;

      // Filter by search query if present
      if (q && !title.toLowerCase().includes(q) && !subtitle.toLowerCase().includes(q)) {
        return;
      }

      const card = document.createElement('article');
      const isActive = mod.status === 'ACTIVE';
      card.className = `module-card ${isActive ? 'is-active' : 'is-planned'}`;

      let iconColorClass = 'icon-muted';
      if (mod.id === 'emergency') iconColorClass = 'icon-crimson';
      else if (mod.id === 'map') iconColorClass = 'icon-blue';

      const iconSvg = ICONS[mod.icon] || '';
      const arrowSvg = ICONS.arrowUpRight || '';
      const dict = TRANSLATIONS[state.lang] || TRANSLATIONS.en;

      card.innerHTML = `
        <div class="card-top">
          <div class="card-icon-wrap ${iconColorClass}">
            ${iconSvg}
          </div>
          <span class="status-badge ${mod.badgeType || 'badge-muted'}">${badge}</span>
        </div>
        <h3 class="module-title">${title}</h3>
        <p class="module-desc">${subtitle}</p>
        <div class="card-footer">
          ${isActive
            ? `<a class="action-link" href="${mod.path}"><span>${dict.openService}</span>${arrowSvg}</a>`
            : `<span class="planned-tag">${dict.plannedNotice}</span>`
          }
        </div>
      `;

      // Allow clicking the active card directly
      if (isActive) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          if (!e.target.closest('a')) {
            window.location.href = mod.path;
          }
        });
      }

      DOM.launcherGrid.appendChild(card);
    });
  }

  /**
   * Switches the live subsystem preview iframe
   */
  function switchPreview(type) {
    state.activePreview = type;

    if (DOM.tabMapPreview && DOM.tabEmergencyPreview) {
      DOM.tabMapPreview.classList.toggle('active', type === 'map');
      DOM.tabEmergencyPreview.classList.toggle('active', type === 'emergency');
    }

    if (DOM.previewFrame && DOM.previewExternalLink) {
      if (type === 'map') {
        const catParam = state.selectedCategory ? `&category=${encodeURIComponent(state.selectedCategory)}` : '';
        DOM.previewFrame.src = `map/index.html?embed=preview${catParam}`;
        DOM.previewExternalLink.href = state.selectedCategory
          ? `map/index.html?category=${encodeURIComponent(state.selectedCategory)}`
          : 'map/index.html';
      } else {
        DOM.previewFrame.src = 'emergency/emergency.html?embed=preview';
        DOM.previewExternalLink.href = 'emergency/emergency.html';
      }
    }
  }

  /**
   * Sets up event listeners
   */
  function initEvents() {
    // Language buttons
    if (DOM.btnLangEn) {
      DOM.btnLangEn.addEventListener('click', () => setLanguage('en'));
    }
    if (DOM.btnLangBn) {
      DOM.btnLangBn.addEventListener('click', () => setLanguage('bn'));
    }

    // Search input
    if (DOM.globalSearchInput) {
      DOM.globalSearchInput.addEventListener('input', e => {
        state.searchQuery = e.target.value;
        if (DOM.searchClearBtn) {
          DOM.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
        }
        renderModules();

        // Forward search query to map preview iframe if currently visible
        if (state.activePreview === 'map' && DOM.previewFrame) {
          try {
            DOM.previewFrame.contentWindow.postMessage({
              type: 'SASTHO_MAP_SEARCH',
              query: state.searchQuery
            }, '*');
          } catch (err) {}
        }
      });
    }

    // Search clear button
    if (DOM.searchClearBtn) {
      DOM.searchClearBtn.addEventListener('click', () => {
        state.searchQuery = '';
        if (DOM.globalSearchInput) {
          DOM.globalSearchInput.value = '';
          DOM.globalSearchInput.focus();
        }
        DOM.searchClearBtn.style.display = 'none';
        renderModules();
      });
    }

    // GPS locate button
    if (DOM.btnDetectGps) {
      DOM.btnDetectGps.addEventListener('click', () => {
        if (!navigator.geolocation) {
          alert(state.lang === 'bn' ? 'ব্রাউজার অবস্থান শনাক্তকরণ সমর্থন করে না।' : 'Geolocation is not supported by your browser.');
          return;
        }

        // Switch to map preview and trigger geolocation
        if (state.activePreview !== 'map') {
          switchPreview('map');
        }

        navigator.geolocation.getCurrentPosition(
          pos => {
            const { latitude, longitude } = pos.coords;
            try {
              DOM.previewFrame.contentWindow.postMessage({
                type: 'SASTHO_MAP_USER_LOCATION',
                lat: latitude,
                lng: longitude
              }, '*');
            } catch (err) {}
          },
          err => {
            console.warn('Geolocation error:', err.message);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    }

    // Preview tabs
    if (DOM.tabMapPreview) {
      DOM.tabMapPreview.addEventListener('click', () => switchPreview('map'));
    }
    if (DOM.tabEmergencyPreview) {
      DOM.tabEmergencyPreview.addEventListener('click', () => switchPreview('emergency'));
    }

    // Window message listener (bridge from iframes)
    window.addEventListener('message', event => {
      const msg = event.data || {};
      if (msg.type === 'SASTHO_SWITCH_PREVIEW') {
        if (msg.preview) switchPreview(msg.preview);
      }
    });
  }

  // Initialization
  function init() {
    if (window.EasyHealthI18n) {
      window.EasyHealthI18n.onLanguageChange(lang => {
        if (state.lang !== lang) {
          state.lang = lang;
          renderCategoryChips();
          renderModules();
        }
      });
    }
    setLanguage(state.lang);
    initEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

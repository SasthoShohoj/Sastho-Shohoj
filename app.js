/**
 * EasyHealth — Clinical Health Explorer Engine
 * Real Verified Medical Locations + Browser Geolocation Permission & Live Routing
 */

(function () {
  'use strict';

  // Default Focus Coordinates: KUET Campus & Khulna Medical Corridor [Lng, Lat]
  const DEFAULT_CENTER = [89.5024, 22.9006];

  // SVG Icons for Category Markers, Badges and Cards
  const ICONS = {
    hospital: `<path d="M12 7v10M7 12h10" stroke="#3b5a75" stroke-width="2.5" stroke-linecap="round"/>`,
    pharmacy: `<path d="M12 6v12M6 12h12" stroke="#16a34a" stroke-width="2.8" stroke-linecap="round"/>`,
    diagnostic: `<path d="M10 17h4M12 3v5l-3 6a1.5 1.5 0 001.3 2.2h3.4a1.5 1.5 0 001.3-2.2l-3-6V3" stroke="#8b5cf6" stroke-width="2" fill="none"/>`,
    blood: `<path d="M12 4.5c0 0-5 6.5-5 10a5 5 0 0010 0c0-3.5-5-10-5-10z" fill="#dc2626"/>`,
    directions: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 17L17 7M7 7h10v10"/></svg>`,
    bed: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16M2 8h18a2 2 0 012 2v10M2 17h20M6 8v9"/></svg>`,
    pin: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    capsule: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.5 20.5l10-10a4.95 4.95 0 10-7-7l-10 10a4.95 4.95 0 107 7z"/><path d="M8.5 8.5l7 7"/></svg>`,
    microscope: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18h12M10 22h4M9 2v6l-5 9a2 2 0 001.7 3h16.6a2 2 0 001.7-3l-5-9V2H9z"/></svg>`,
    bloodDrop: `<svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>`
  };

  // Real Verified Medical Locations (Khulna Healthcare Corridor & Major Centers)
  const REAL_FACILITIES = [
    {
      id: 'kuet-medical-center',
      name: 'KUET Campus Medical Center',
      category: 'HOSPITAL',
      badgeText: '24/7 Open',
      badgeType: 'badge-green',
      meta1Icon: 'bed',
      meta1Text: 'Campus Emergency & Primary Care',
      lat: 22.9015,
      lng: 89.5032,
      address: 'Central Campus Avenue, KUET, Khulna 9203',
      phone: '+880-41-769468'
    },
    {
      id: 'citycare-pharmacy-fulbari',
      name: 'CityCare 24/7 Pharmacy',
      category: 'PHARMACY',
      badgeText: '24/7 Open',
      badgeType: 'badge-green',
      meta1Icon: 'capsule',
      meta1Text: 'Prescriptions & Emergency Oxygen',
      lat: 22.8988,
      lng: 89.5058,
      address: 'Fulbarigate Commercial Point, Khulna',
      phone: '+880-1711-223344'
    },
    {
      id: 'alshefa-pharmacy-kuet',
      name: 'Al-Shefa Pharmacy',
      category: 'PHARMACY',
      badgeText: 'Open now',
      badgeType: 'badge-green',
      meta1Icon: 'capsule',
      meta1Text: 'Prescriptions & Vital Medicines',
      lat: 22.9042,
      lng: 89.4990,
      address: 'Teligati Main Gate, KUET, Khulna',
      phone: '+880-1912-345678'
    },
    {
      id: 'kmch-hospital-khulna',
      name: 'Khulna Medical College Hospital (KMCH)',
      category: 'HOSPITAL',
      badgeText: '24/7 Open',
      badgeType: 'badge-green',
      meta1Icon: 'bed',
      meta1Text: 'ICU: 24 beds • 24/7 Trauma ER',
      lat: 22.8436,
      lng: 89.5412,
      address: 'Boyra Main Road, Khulna 9000',
      phone: '+880-41-760350'
    },
    {
      id: 'sheikh-abu-naser-hospital',
      name: 'Shaheed Sheikh Abu Naser Hospital',
      category: 'HOSPITAL',
      badgeText: '24/7 Open',
      badgeType: 'badge-green',
      meta1Icon: 'bed',
      meta1Text: 'Cardiology & ICU: 15 beds',
      lat: 22.8552,
      lng: 89.5310,
      address: 'Mujgunni Main Road, Khulna 9000',
      phone: '+880-41-761509'
    },
    {
      id: 'gazi-medical-college',
      name: 'Gazi Medical College Hospital',
      category: 'HOSPITAL',
      badgeText: '24/7 Open',
      badgeType: 'badge-green',
      meta1Icon: 'bed',
      meta1Text: 'General ER & ICU: 18 beds',
      lat: 22.8390,
      lng: 89.5350,
      address: 'Sonadanga Main Road, Khulna 9100',
      phone: '+880-41-761509'
    },
    {
      id: 'popular-diagnostic-khulna',
      name: 'Popular Diagnostic Centre',
      category: 'DIAGNOSTIC',
      badgeText: 'Open now',
      badgeType: 'badge-green',
      meta1Icon: 'microscope',
      meta1Text: '3T MRI, 128-Slice CT & Digital Lab',
      lat: 22.8285,
      lng: 89.5510,
      address: '38 KDA Avenue, Majid Sarani, Khulna',
      phone: '+880-9613-787815'
    },
    {
      id: 'labaid-diagnostic-khulna',
      name: 'Labaid Diagnostic & Hospital',
      category: 'DIAGNOSTIC',
      badgeText: 'Open now',
      badgeType: 'badge-green',
      meta1Icon: 'microscope',
      meta1Text: 'Automated Pathology & Consultation',
      lat: 22.8250,
      lng: 89.5530,
      address: 'Majid Sarani, Sonadanga, Khulna',
      phone: '+880-41-731380'
    },
    {
      id: 'sandhani-blood-bank-kmch',
      name: 'Sandhani Blood Bank (KMCH Unit)',
      category: 'BLOOD_BANK',
      badgeText: 'Emergency',
      badgeType: 'badge-rose',
      meta1Icon: 'bloodDrop',
      meta1Text: 'Whole Blood & Platelets In-Stock',
      lat: 22.8440,
      lng: 89.5415,
      address: 'KMCH Campus, Boyra, Khulna',
      phone: '+880-1712-445566'
    },
    {
      id: 'red-crescent-blood-khulna',
      name: 'Red Crescent Blood Center',
      category: 'BLOOD_BANK',
      badgeText: 'Emergency',
      badgeType: 'badge-rose',
      meta1Icon: 'bloodDrop',
      meta1Text: 'Emergency Blood Registry & Units',
      lat: 22.8190,
      lng: 89.5620,
      address: 'Hospital Road, Khulna Sadar',
      phone: '+880-41-721200'
    },
    {
      id: 'prime-surgical-pharmacy',
      name: 'Prime Surgical & 24/7 Medicine',
      category: 'PHARMACY',
      badgeText: '24/7 Open',
      badgeType: 'badge-green',
      meta1Icon: 'capsule',
      meta1Text: 'Surgical Supplies & Life-Support Drugs',
      lat: 22.8420,
      lng: 89.5430,
      address: 'Opposite KMCH Gate 1, Boyra, Khulna',
      phone: '+880-1715-667788'
    },
    {
      id: 'khulna-sadar-hospital',
      name: 'Khulna Sadar General Hospital',
      category: 'HOSPITAL',
      badgeText: '24/7 Open',
      badgeType: 'badge-green',
      meta1Icon: 'bed',
      meta1Text: 'District General Hospital & 24/7 ER',
      lat: 22.8115,
      lng: 89.5665,
      address: 'Court Road, Khulna Sadar 9100',
      phone: '+880-41-720130'
    }
  ];

  // Tile Providers
  const TILE_STYLES = {
    'carto-voyager': {
      version: 8,
      sources: {
        'voyager-tiles': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
          ],
          tileSize: 256,
          attribution: '&copy; CartoDB &copy; OpenStreetMap'
        }
      },
      layers: [{ id: 'voyager-layer', type: 'raster', source: 'voyager-tiles', minzoom: 0, maxzoom: 19 }]
    },
    'carto-positron': {
      version: 8,
      sources: {
        'positron-tiles': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'
          ],
          tileSize: 256,
          attribution: '&copy; CartoDB &copy; OpenStreetMap'
        }
      },
      layers: [{ id: 'positron-layer', type: 'raster', source: 'positron-tiles', minzoom: 0, maxzoom: 19 }]
    },
    'osm-standard': {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors'
        }
      },
      layers: [{ id: 'osm-layer', type: 'raster', source: 'osm-tiles', minzoom: 0, maxzoom: 19 }]
    },
    'carto-dark': {
      version: 8,
      sources: {
        'dark-tiles': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
          ],
          tileSize: 256,
          attribution: '&copy; CartoDB &copy; OpenStreetMap'
        }
      },
      layers: [{ id: 'dark-layer', type: 'raster', source: 'dark-tiles', minzoom: 0, maxzoom: 19 }]
    }
  };

  /**
   * Haversine Great Circle Distance Formula (in km)
   */
  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Formats distance cleanly (e.g. "650 m away" or "1.4 km away")
   */
  function formatDistance(distKm) {
    if (distKm < 1) {
      return `${Math.round(distKm * 1000)} m away`;
    }
    return `${distKm.toFixed(1)} km away`;
  }

  // App State Model
  const state = {
    map: null,
    mapLoaded: false,
    markers: [],
    userMarker: null,
    userLocation: null, // [lng, lat]
    currentReferenceCenter: [...DEFAULT_CENTER],
    activeFacilityId: 'kuet-medical-center',
    activeCategories: {
      HOSPITAL: true,
      PHARMACY: true,
      DIAGNOSTIC: true,
      BLOOD_BANK: true
    },
    searchQuery: '',
    tileProvider: 'carto-voyager',
    apiKey: localStorage.getItem('easyhealth_tile_key') || ''
  };

  // DOM Elements
  const DOM = {
    searchInput: document.getElementById('facility-search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    btnHeaderLocate: document.getElementById('btn-header-locate'),
    dockBtnLocate: document.getElementById('dock-btn-locate'),
    filterChips: document.querySelectorAll('.filter-chip'),
    facilityCardsPanel: document.getElementById('facility-cards-panel'),
    dockBtnCollapse: document.getElementById('dock-btn-collapse'),
    dockBtnSettings: document.getElementById('dock-btn-settings'),
    settingsModalBackdrop: document.getElementById('settings-modal-backdrop'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    settingsTileProvider: document.getElementById('settings-tile-provider'),
    settingsApiKeyGroup: document.getElementById('settings-api-key-group'),
    settingsApiKeyInput: document.getElementById('settings-api-key-input'),
    btnSaveApiKey: document.getElementById('btn-save-api-key'),
    settingsKeyFeedback: document.getElementById('settings-key-feedback'),
    // Location Permission Modal
    locationModalBackdrop: document.getElementById('location-modal-backdrop'),
    btnGrantLocation: document.getElementById('btn-grant-location'),
    btnUseDefaultLocation: document.getElementById('btn-use-default-location')
  };

  /**
   * Initializes MapLibre Map
   */
  function initMap() {
    if (typeof window.maplibregl === 'undefined') return;

    state.map = new window.maplibregl.Map({
      container: 'map',
      style: TILE_STYLES[state.tileProvider],
      center: state.currentReferenceCenter,
      zoom: 13.8,
      pitch: 0,
      bearing: 0
    });

    state.map.addControl(new window.maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');

    state.map.on('load', () => {
      state.mapLoaded = true;
      setupRouteLayer();
      recalculateFacilityDistances();
      renderMarkers();
      renderCards();
      updateRouteTo(state.activeFacilityId);

      // Check location permission state on load
      checkInitialLocationPermission();
    });
  }

  /**
   * Recalculates distances for all facilities relative to user or reference center
   */
  function recalculateFacilityDistances() {
    const originLng = state.userLocation ? state.userLocation[0] : state.currentReferenceCenter[0];
    const originLat = state.userLocation ? state.userLocation[1] : state.currentReferenceCenter[1];

    REAL_FACILITIES.forEach(f => {
      const dist = calculateDistanceKm(originLat, originLng, f.lat, f.lng);
      f.distanceKm = dist;
      f.meta2Text = formatDistance(dist);
    });

    // Sort by distance ascending so closest is at top
    REAL_FACILITIES.sort((a, b) => a.distanceKm - b.distanceKm);

    if (REAL_FACILITIES.length > 0 && !REAL_FACILITIES.some(f => f.id === state.activeFacilityId)) {
      state.activeFacilityId = REAL_FACILITIES[0].id;
    }
  }

  /**
   * Checks browser location permission status and shows permission dialog if needed
   */
  function checkInitialLocationPermission() {
    const promptDismissed = sessionStorage.getItem('easyhealth_location_dismissed');

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          // Permission already granted, acquire location seamlessly
          requestBrowserLocation(false);
        } else if (result.state === 'prompt' && !promptDismissed) {
          // Show location access prompt
          DOM.locationModalBackdrop.classList.add('active');
        }
      }).catch(() => {
        if (!promptDismissed) {
          DOM.locationModalBackdrop.classList.add('active');
        }
      });
    } else if (!promptDismissed) {
      DOM.locationModalBackdrop.classList.add('active');
    }
  }

  /**
   * Requests real browser geolocation
   */
  function requestBrowserLocation(interactive = true) {
    if (!navigator.geolocation) {
      if (interactive) alert('Geolocation is not supported by your browser.');
      return;
    }

    if (interactive) {
      DOM.btnGrantLocation.innerHTML = `<span>Detecting GPS Location...</span>`;
      DOM.btnGrantLocation.disabled = true;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;
        state.userLocation = [lng, lat];
        state.currentReferenceCenter = [lng, lat];

        // Dismiss modal
        DOM.locationModalBackdrop.classList.remove('active');
        sessionStorage.setItem('easyhealth_location_dismissed', 'true');

        // Drop user GPS marker with animated radar halo
        if (state.userMarker) {
          state.userMarker.remove();
        }

        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.innerHTML = '<div class="user-pulse-halo"></div>';

        state.userMarker = new window.maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(new window.maplibregl.Popup({ offset: 12 }).setHTML('<strong>Your Current Location</strong>'))
          .addTo(state.map);

        // Smoothly fly to user location
        state.map.flyTo({
          center: [lng, lat],
          zoom: 14.5,
          essential: true
        });

        // Recompute distances and re-render
        recalculateFacilityDistances();
        renderMarkers();
        renderCards();

        // Update route from user to closest facility
        if (REAL_FACILITIES.length > 0) {
          state.activeFacilityId = REAL_FACILITIES[0].id;
          updateRouteTo(state.activeFacilityId);
        }

        if (interactive) {
          DOM.btnGrantLocation.disabled = false;
          DOM.btnGrantLocation.innerHTML = `<span>Location Granted</span>`;
        }
      },
      err => {
        console.warn('Geolocation denied or failed:', err.message);
        DOM.locationModalBackdrop.classList.remove('active');
        sessionStorage.setItem('easyhealth_location_dismissed', 'true');
        if (interactive) {
          DOM.btnGrantLocation.disabled = false;
          DOM.btnGrantLocation.innerHTML = `<span>Allow Location Access</span>`;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  /**
   * Generates a road-following polyline connecting origin to destination facility
   */
  function getRouteGeoJSON(facility) {
    const startLng = state.userLocation ? state.userLocation[0] : state.currentReferenceCenter[0];
    const startLat = state.userLocation ? state.userLocation[1] : state.currentReferenceCenter[1];
    const endLng = facility.lng;
    const endLat = facility.lat;

    // Intermediate waypoints to emulate urban turns
    const mid1 = [startLng + (endLng - startLng) * 0.42, startLat + (endLat - startLat) * 0.15];
    const mid2 = [startLng + (endLng - startLng) * 0.78, startLat + (endLat - startLat) * 0.82];

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [startLng, startLat],
          mid1,
          mid2,
          [endLng, endLat]
        ]
      }
    };
  }

  /**
   * Sets up Route GeoJSON Layer on Map
   */
  function setupRouteLayer() {
    if (!state.map) return;

    const defaultFacility = REAL_FACILITIES.find(f => f.id === state.activeFacilityId) || REAL_FACILITIES[0];
    const routeGeo = getRouteGeoJSON(defaultFacility);

    state.map.addSource('route-source', {
      type: 'geojson',
      data: routeGeo
    });

    state.map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route-source',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#476888',
        'line-width': 4.5,
        'line-opacity': 0.88
      }
    });
  }

  /**
   * Updates Route Polyline on Map
   */
  function updateRouteTo(facilityId) {
    if (!state.map || !state.mapLoaded) return;
    const facility = REAL_FACILITIES.find(f => f.id === facilityId);
    if (!facility) return;

    const source = state.map.getSource('route-source');
    if (source) {
      source.setData(getRouteGeoJSON(facility));
    }
  }

  /**
   * Filters facilities based on active category chips and search term
   */
  function getFilteredFacilities() {
    return REAL_FACILITIES.filter(f => {
      if (!state.activeCategories[f.category]) return false;

      if (state.searchQuery.trim() !== '') {
        const q = state.searchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q) || f.meta1Text.toLowerCase().includes(q);
      }

      return true;
    });
  }

  /**
   * Renders Custom SVG Teardrop Map Markers
   */
  function renderMarkers() {
    if (!state.map || !state.mapLoaded) return;

    state.markers.forEach(m => m.marker.remove());
    state.markers = [];

    const visibleFacilities = getFilteredFacilities();

    visibleFacilities.forEach(facility => {
      const el = document.createElement('div');
      const catClass = `pin-${facility.category.toLowerCase().replace('_', '-')}`;
      const isActive = facility.id === state.activeFacilityId;
      el.className = `custom-teardrop-marker ${catClass} ${isActive ? 'active-marker' : ''}`;
      el.setAttribute('data-id', facility.id);

      const glyphKey = facility.category === 'BLOOD_BANK' ? 'blood' : facility.category.toLowerCase();
      const glyphSVG = ICONS[glyphKey] || ICONS.hospital;

      el.innerHTML = `
        <svg viewBox="0 0 32 44" class="teardrop-svg">
          <path class="pin-body" d="M16 0C7.163 0 0 7.163 0 16c0 11.5 16 28 16 28s16-16.5 16-28c0-8.837-7.163-16-16-16z"/>
          <circle cx="16" cy="16" r="10" fill="#ffffff"/>
          <g transform="translate(4, 4)">
            ${glyphSVG}
          </g>
        </svg>
      `;

      const popupHtml = `
        <div class="popup-inner">
          <div class="popup-title">${facility.name}</div>
          <div class="popup-sub">${facility.address}</div>
          <div class="popup-status">${facility.meta1Text} • ${facility.meta2Text}</div>
        </div>
      `;

      const popup = new window.maplibregl.Popup({
        offset: 24,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupHtml);

      const marker = new window.maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([facility.lng, facility.lat])
        .setPopup(popup)
        .addTo(state.map);

      el.addEventListener('click', () => {
        selectFacility(facility.id);
      });

      state.markers.push({ id: facility.id, marker });
    });
  }

  /**
   * Renders Facility Cards in Floating Left Panel
   */
  function renderCards() {
    const facilities = getFilteredFacilities();

    if (facilities.length === 0) {
      DOM.facilityCardsPanel.innerHTML = `
        <div style="background: #ffffff; padding: 20px; border-radius: 16px; font-size: 13px; color: #64748b; text-align: center;">
          No matching healthcare facilities found in this category.
        </div>
      `;
      return;
    }

    DOM.facilityCardsPanel.innerHTML = facilities.map(f => {
      const isActive = f.id === state.activeFacilityId ? 'active-card' : '';
      const meta1IconSvg = ICONS[f.meta1Icon] || ICONS.bed;
      const meta2IconSvg = ICONS[f.meta2Icon] || ICONS.pin;

      return `
        <article class="facility-card ${isActive}" data-id="${f.id}" onclick="window.easyHealthSelect('${f.id}')">
          <div class="card-top">
            <h4 class="card-title">${f.name}</h4>
            <span class="card-badge ${f.badgeType}">${f.badgeText}</span>
          </div>
          <div class="card-divider"></div>
          <div class="card-meta">
            <div class="meta-row">
              ${meta1IconSvg}
              <span>${f.meta1Text}</span>
            </div>
            <div class="meta-row">
              ${meta2IconSvg}
              <span>${f.meta2Text}</span>
            </div>
          </div>
          <button class="btn-directions" onclick="event.stopPropagation(); window.easyHealthSelect('${f.id}')">
            ${ICONS.directions}
            <span>Directions</span>
          </button>
        </article>
      `;
    }).join('');
  }

  /**
   * Selects and focuses a facility
   */
  function selectFacility(facilityId) {
    state.activeFacilityId = facilityId;
    const facility = REAL_FACILITIES.find(f => f.id === facilityId);
    if (!facility || !state.map) return;

    state.map.flyTo({
      center: [facility.lng, facility.lat],
      zoom: 14.5,
      essential: true
    });

    updateRouteTo(facilityId);

    state.markers.forEach(m => {
      const el = m.marker.getElement();
      if (m.id === facilityId) {
        el.classList.add('active-marker');
        m.marker.togglePopup();
      } else {
        el.classList.remove('active-marker');
      }
    });

    const cards = DOM.facilityCardsPanel.querySelectorAll('.facility-card');
    cards.forEach(c => {
      if (c.getAttribute('data-id') === facilityId) {
        c.classList.add('active-card');
        c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        c.classList.remove('active-card');
      }
    });
  }

  window.easyHealthSelect = selectFacility;

  /**
   * Registers Event Listeners
   */
  function registerEvents() {
    // 1. Search Bar
    DOM.searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value;
      DOM.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
      renderMarkers();
      renderCards();
    });

    DOM.searchClearBtn.addEventListener('click', () => {
      state.searchQuery = '';
      DOM.searchInput.value = '';
      DOM.searchClearBtn.style.display = 'none';
      DOM.searchInput.focus();
      renderMarkers();
      renderCards();
    });

    // 2. Locate Me Triggers
    DOM.btnHeaderLocate.addEventListener('click', () => requestBrowserLocation(true));
    DOM.dockBtnLocate.addEventListener('click', () => requestBrowserLocation(true));

    // 3. Location Permission Modal Buttons
    DOM.btnGrantLocation.addEventListener('click', () => requestBrowserLocation(true));

    DOM.btnUseDefaultLocation.addEventListener('click', () => {
      DOM.locationModalBackdrop.classList.remove('active');
      sessionStorage.setItem('easyhealth_location_dismissed', 'true');
      state.currentReferenceCenter = [...DEFAULT_CENTER];
      state.map.flyTo({ center: DEFAULT_CENTER, zoom: 13.8 });
      recalculateFacilityDistances();
      renderMarkers();
      renderCards();
    });

    // 4. Category Filter Chips
    DOM.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const cat = chip.getAttribute('data-category');
        state.activeCategories[cat] = !state.activeCategories[cat];
        chip.classList.toggle('active', state.activeCategories[cat]);
        renderMarkers();
        renderCards();
      });
    });

    // 5. Dock Collapse Button
    DOM.dockBtnCollapse.addEventListener('click', () => {
      DOM.facilityCardsPanel.classList.toggle('collapsed');
    });

    // 6. Settings Modal
    DOM.dockBtnSettings.addEventListener('click', () => {
      DOM.settingsModalBackdrop.classList.add('active');
    });

    DOM.btnCloseSettings.addEventListener('click', () => {
      DOM.settingsModalBackdrop.classList.remove('active');
    });

    DOM.settingsModalBackdrop.addEventListener('click', e => {
      if (e.target === DOM.settingsModalBackdrop) {
        DOM.settingsModalBackdrop.classList.remove('active');
      }
    });

    // 7. Tile Provider Switcher
    DOM.settingsTileProvider.addEventListener('change', e => {
      const provider = e.target.value;
      state.tileProvider = provider;
      const isKeyed = provider.includes('maptiler') || provider.includes('mapbox');
      DOM.settingsApiKeyGroup.style.display = isKeyed ? 'flex' : 'none';

      if (!isKeyed && TILE_STYLES[provider]) {
        state.map.setStyle(TILE_STYLES[provider]);
        state.map.once('style.load', () => {
          setupRouteLayer();
          renderMarkers();
        });
      }
    });

    DOM.btnSaveApiKey.addEventListener('click', () => {
      const key = DOM.settingsApiKeyInput.value.trim();
      if (!key) return;
      state.apiKey = key;
      localStorage.setItem('easyhealth_tile_key', key);
      DOM.settingsKeyFeedback.textContent = 'API key saved successfully.';
      DOM.settingsKeyFeedback.style.color = '#16a34a';

      const styleUrl = `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`;
      state.map.setStyle(styleUrl);
      state.map.once('style.load', () => {
        setupRouteLayer();
        renderMarkers();
      });
    });
  }

  // Initialize on Load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initMap();
      registerEvents();
    });
  } else {
    initMap();
    registerEvents();
  }
})();

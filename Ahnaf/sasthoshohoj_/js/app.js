/**
 * SasthoShohoj — Vanilla JavaScript Frontend
 * ─────────────────────────────────────────────────────────────────
 * Handles:
 *  - Backend health monitoring & offline setup guide
 *  - Main tab navigation (Upload Document / Medical Reports)
 *  - Upload mode selection:
 *      1) Medical Test Report Upload (EasyOCR + validation + extraction + save)
 *      2) Prescription Upload (No OCR required, direct save with optional metadata)
 *  - Medical Reports browser:
 *      - Sub-tabs: Test Reports & Prescriptions
 *      - Date sorting (newest/oldest)
 *      - Search & Filters (Hospital, Doctor, Month, Date Range)
 *      - Grouping by Month -> Sub-grouping by Date Range
 *      - Big Split-View Details Dialog Modal (Original doc on left, details on right)
 */

(function () {
  'use strict';

  const API_BASE = 'http://localhost:5001';
  const ACCEPTED_TYPES = [
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png',
    'image/tiff', 'image/tif', 'image/bmp', 'image/webp'
  ];
  const ACCEPTED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.webp'];
  const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

  // ─── DOM References ──────────────────────────────────────────────
  const dom = {
    // Theme & Backend status
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    statusBtn:      document.getElementById('statusBtn'),
    statusDot:      document.getElementById('statusDot'),
    statusText:     document.getElementById('statusText'),
    statusChevron:  document.getElementById('statusChevron'),
    offlineGuide:   document.getElementById('offlineGuide'),
    statusOverlay:  document.getElementById('statusOverlay'),
    retryBtn:       document.getElementById('retryBtn'),

    // Main Tabs
    tabBtns:        document.querySelectorAll('.tab-btn'),
    tabUpload:      document.getElementById('tabUpload'),
    tabReports:     document.getElementById('tabReports'),

    // Upload Mode Selector
    modeCards:        document.querySelectorAll('.upload-mode-card'),
    prescriptionForm: document.getElementById('prescriptionForm'),
    rxTitle:          document.getElementById('rxTitle'),
    rxDate:           document.getElementById('rxDate'),
    rxDoctor:         document.getElementById('rxDoctor'),
    rxFacility:       document.getElementById('rxFacility'),
    rxPatient:        document.getElementById('rxPatient'),
    rxNotes:          document.getElementById('rxNotes'),
    dropLabel:        document.getElementById('dropLabel'),

    // Upload
    fileInput:      document.getElementById('fileInput'),
    dropZone:       document.getElementById('dropZone'),
    fileStrip:      document.getElementById('fileStrip'),
    fileName:       document.getElementById('fileName'),
    fileSize:       document.getElementById('fileSize'),
    fileIcon:       document.getElementById('fileIcon'),
    removeFileBtn:  document.getElementById('removeFileBtn'),
    previewWrap:    document.getElementById('previewWrap'),
    previewImg:     document.getElementById('previewImg'),
    processBtn:     document.getElementById('processBtn'),
    processPill:    document.getElementById('processPill'),
    goToReportsBtn: document.getElementById('goToReportsBtn'),

    // Banners
    processingBanner: document.getElementById('processingBanner'),
    rejectionBanner:  document.getElementById('rejectionBanner'),
    rejectionReason:  document.getElementById('rejectionReason'),
    rejectionMeta:    document.getElementById('rejectionMeta'),

    // Inline Results Card (after Test Report upload)
    resultCard:     document.getElementById('resultCard'),
    resultFilename: document.getElementById('resultFilename'),
    resultDocType:  document.getElementById('resultDocType'),
    resultConf:     document.getElementById('resultConf'),
    metaPatient:    document.getElementById('metaPatient'),
    metaAge:        document.getElementById('metaAge'),
    metaSex:        document.getElementById('metaSex'),
    metaDate:       document.getElementById('metaDate'),
    metaFacility:   document.getElementById('metaFacility'),
    metaDoctor:     document.getElementById('metaDoctor'),
    metaFileType:   document.getElementById('metaFileType'),
    metaFileSize:   document.getElementById('metaFileSize'),
    metaPages:      document.getElementById('metaPages'),
    metaOcrConf:    document.getElementById('metaOcrConf'),

    findingsSection:  document.getElementById('findingsSection'),
    findingsText:     document.getElementById('findingsText'),
    diagnosisSection: document.getElementById('diagnosisSection'),
    diagnosisText:    document.getElementById('diagnosisText'),
    labSection:       document.getElementById('labSection'),
    labTbody:         document.getElementById('labTbody'),
    debugToggle:      document.getElementById('debugToggle'),
    rawText:          document.getElementById('rawText'),

    // Medical Reports Tab
    subtabBtns:         document.querySelectorAll('.subtab-btn'),
    countTestReports:   document.getElementById('countTestReports'),
    countPrescriptions: document.getElementById('countPrescriptions'),
    filterSearch:       document.getElementById('filterSearch'),
    filterHospital:     document.getElementById('filterHospital'),
    filterDoctor:       document.getElementById('filterDoctor'),
    filterMonth:        document.getElementById('filterMonth'),
    filterDateFrom:     document.getElementById('filterDateFrom'),
    filterDateTo:       document.getElementById('filterDateTo'),
    filterSort:         document.getElementById('filterSort'),
    clearFiltersBtn:    document.getElementById('clearFiltersBtn'),
    reportsContainer:   document.getElementById('reportsContainer'),

    // Details Modal
    detailModal:         document.getElementById('detailModal'),
    modalBadge:          document.getElementById('modalBadge'),
    modalTitle:          document.getElementById('modalTitle'),
    modalDate:           document.getElementById('modalDate'),
    modalCloseBtn:       document.getElementById('modalCloseBtn'),
    modalOpenNewTab:     document.getElementById('modalOpenNewTab'),
    modalDocViewer:      document.getElementById('modalDocViewer'),
    modalDetailsContent: document.getElementById('modalDetailsContent'),
  };

  // ─── State ───────────────────────────────────────────────────────
  const state = {
    backendOnline: null, // null (checking) | true | false
    uploadMode: 'test_report', // 'test_report' | 'prescription'
    currentFile: null,
    previewUrl: null,
    processing: false,
    activeTab: 'upload',
    activeSubTab: 'test_report', // 'test_report' | 'prescription'
    allRecords: [],
    timerId: null,
    elapsedSeconds: 0,
  };

  // ─── Helpers ─────────────────────────────────────────────────────
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function isValidFileType(file) {
    if (!file) return false;
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    return ACCEPTED_TYPES.includes(type) || ACCEPTED_EXTS.some(ext => name.endsWith(ext));
  }

  function isImageFile(file) {
    if (!file) return false;
    const name = file.name.toLowerCase();
    return (file.type || '').startsWith('image/') || /\.(jpg|jpeg|png|tiff|tif|bmp|webp)$/.test(name);
  }

  function isImageFilename(filename) {
    return /\.(jpg|jpeg|png|tiff|tif|bmp|webp)$/i.test(filename || '');
  }

  // ─── Backend Health Monitoring ───────────────────────────────────
  async function checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
      clearTimeout(timer);
      setBackendStatus(res.ok);
    } catch {
      setBackendStatus(false);
    }
  }

  function setBackendStatus(online) {
    const wasOffline = state.backendOnline !== true;
    state.backendOnline = online;

    dom.statusBtn.className = 'backend-status-btn';
    dom.statusDot.className = 'status-dot';

    if (online === true) {
      dom.statusBtn.classList.add('online');
      dom.statusDot.classList.add('online');
      dom.statusText.textContent = 'Backend Online';
      dom.statusChevron.style.display = 'none';
      closeOfflineGuide();
      if (wasOffline && state.activeTab === 'reports') {
        fetchAndRenderRecords();
      }
    } else if (online === false) {
      dom.statusBtn.classList.add('offline');
      dom.statusDot.classList.add('offline');
      dom.statusText.textContent = 'Backend Offline';
      dom.statusChevron.style.display = 'inline-block';
    } else {
      dom.statusBtn.classList.add('checking');
      dom.statusDot.classList.add('checking');
      dom.statusText.textContent = 'Checking…';
      dom.statusChevron.style.display = 'none';
    }

    updateProcessBtnState();
  }

  function toggleOfflineGuide() {
    if (state.backendOnline === false) {
      const isHidden = dom.offlineGuide.classList.contains('hidden');
      if (isHidden) {
        dom.offlineGuide.classList.remove('hidden');
        dom.statusOverlay.classList.remove('hidden');
      } else {
        closeOfflineGuide();
      }
    }
  }

  function closeOfflineGuide() {
    dom.offlineGuide.classList.add('hidden');
    dom.statusOverlay.classList.add('hidden');
  }

  // ─── Main Tab Switching ──────────────────────────────────────────
  function switchTab(tabId) {
    state.activeTab = tabId;
    dom.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    if (tabId === 'upload') {
      dom.tabUpload.classList.add('active');
      dom.tabReports.classList.remove('active');
    } else {
      dom.tabUpload.classList.remove('active');
      dom.tabReports.classList.add('active');
      fetchAndRenderRecords();
    }
  }

  // ─── Upload Mode Switching (Test Report vs Prescription) ─────────
  function setUploadMode(mode) {
    state.uploadMode = mode;
    dom.modeCards.forEach(card => {
      card.classList.toggle('active', card.dataset.mode === mode);
    });

    clearResults();
    hideErrorPill();
    dom.goToReportsBtn.classList.add('hidden');

    if (mode === 'prescription') {
      dom.prescriptionForm.classList.remove('hidden');
      dom.dropLabel.textContent = 'Drop your prescription here';
    } else {
      dom.prescriptionForm.classList.add('hidden');
      dom.dropLabel.textContent = 'Drop your medical test report here';
    }

    updateProcessBtnState();
  }

  // ─── File Selection & Drag & Drop ────────────────────────────────
  function handleFileSelected(file) {
    if (!file) return;

    if (!isValidFileType(file)) {
      showErrorPill('Unsupported format. Please upload PDF, JPG, PNG, TIFF, BMP, or WebP.');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      showErrorPill('File is too large. Maximum size is 20 MB.');
      return;
    }

    clearResults();
    hideErrorPill();
    dom.goToReportsBtn.classList.add('hidden');

    state.currentFile = file;

    dom.fileName.textContent = file.name;
    dom.fileSize.textContent = formatBytes(file.size);
    dom.fileStrip.classList.remove('hidden');

    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = null;
    }

    if (isImageFile(file)) {
      state.previewUrl = URL.createObjectURL(file);
      dom.previewImg.src = state.previewUrl;
      dom.previewWrap.classList.remove('hidden');
      dom.fileIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    } else {
      dom.previewWrap.classList.add('hidden');
      dom.fileIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    }

    updateProcessBtnState();
  }

  function removeCurrentFile() {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = null;
    }
    state.currentFile = null;
    dom.fileInput.value = '';
    dom.fileStrip.classList.add('hidden');
    dom.previewWrap.classList.add('hidden');
    clearResults();
    hideErrorPill();
    dom.goToReportsBtn.classList.add('hidden');
    updateProcessBtnState();
  }

  function updateProcessBtnState() {
    const canProcess = Boolean(state.currentFile) && state.backendOnline === true && !state.processing;
    dom.processBtn.disabled = !canProcess;

    if (!state.processing) {
      if (state.uploadMode === 'prescription') {
        dom.processBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Prescription`;
      } else {
        dom.processBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 7 4"/><polyline points="17 4 20 4 20 7"/><polyline points="20 17 20 20 17 20"/><polyline points="7 20 4 20 4 17"/><line x1="4" y1="12" x2="20" y2="12"/></svg> Analyse &amp; Save Report`;
      }
    }
  }

  function clearResults() {
    dom.resultCard.classList.add('hidden');
    dom.rejectionBanner.classList.add('hidden');
    dom.processingBanner.classList.add('hidden');
    dom.rawText.classList.add('hidden');
    dom.debugToggle.classList.remove('open');
    stopTimer();
  }

  function startTimer() {
    stopTimer();
    state.elapsedSeconds = 0;
    updateProcessingBannerText();
    state.timerId = setInterval(() => {
      state.elapsedSeconds++;
      updateProcessingBannerText();
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function updateProcessingBannerText() {
    const s = state.elapsedSeconds;
    const isPdf = state.currentFile && state.currentFile.name.toLowerCase().endsWith('.pdf');
    let message = `Running OCR & Medical Validation… (${s}s)`;

    if (s > 10) {
      message = `Processing high-resolution document on CPU… (${s}s)`;
    } else if (isPdf && s < 3) {
      message = `Inspecting PDF content & validating medical data… (${s}s)`;
    }

    dom.processingBanner.innerHTML = `<div class="spinner"></div> <span>${escapeHtml(message)}</span>`;
  }

  function showErrorPill(msg) {
    dom.processPill.className = 'status-pill error';
    dom.processPill.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${escapeHtml(msg)}`;
    dom.processPill.style.display = 'inline-flex';
  }

  function showSuccessPill(msg) {
    dom.processPill.className = 'status-pill success';
    dom.processPill.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ${escapeHtml(msg)}`;
    dom.processPill.style.display = 'inline-flex';
  }

  function hideErrorPill() {
    dom.processPill.style.display = 'none';
  }

  // ─── Handle Upload Action (Prescription vs Test Report) ──────────
  async function handleUploadSubmit() {
    if (!state.currentFile || state.backendOnline !== true || state.processing) return;

    if (state.uploadMode === 'prescription') {
      await submitPrescription();
    } else {
      await analyseTestReport();
    }
  }

  async function submitPrescription() {
    state.processing = true;
    updateProcessBtnState();
    clearResults();
    hideErrorPill();
    dom.goToReportsBtn.classList.add('hidden');
    dom.processBtn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Saving…`;

    try {
      const formData = new FormData();
      formData.append('file', state.currentFile);
      formData.append('title', dom.rxTitle.value.trim());
      formData.append('date', dom.rxDate.value.trim());
      formData.append('doctor', dom.rxDoctor.value.trim());
      formData.append('facility', dom.rxFacility.value.trim());
      formData.append('patient_name', dom.rxPatient.value.trim());
      formData.append('notes', dom.rxNotes.value.trim());

      const res = await fetch(`${API_BASE}/api/prescriptions`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      state.processing = false;
      updateProcessBtnState();

      if (!res.ok) {
        showErrorPill(data.error || 'Failed to save prescription.');
        return;
      }

      showSuccessPill('Prescription saved (no OCR needed)');
      state.activeSubTab = 'prescription';
      dom.goToReportsBtn.classList.remove('hidden');

      // Clear prescription form inputs
      dom.rxTitle.value = '';
      dom.rxDate.value = '';
      dom.rxDoctor.value = '';
      dom.rxFacility.value = '';
      dom.rxPatient.value = '';
      dom.rxNotes.value = '';
    } catch {
      state.processing = false;
      updateProcessBtnState();
      showErrorPill('Could not connect to server.');
    }
  }

  async function analyseTestReport() {
    state.processing = true;
    updateProcessBtnState();
    clearResults();
    hideErrorPill();
    dom.goToReportsBtn.classList.add('hidden');

    dom.processBtn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Processing…`;
    dom.processingBanner.classList.remove('hidden');
    startTimer();

    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), 60000);

    try {
      const formData = new FormData();
      formData.append('file', state.currentFile);

      const res = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(abortTimeout);
      stopTimer();
      dom.processingBanner.classList.add('hidden');
      state.processing = false;
      updateProcessBtnState();

      const rawJson = await res.text();
      let data;
      try {
        data = JSON.parse(rawJson);
      } catch {
        showErrorPill('Server returned non-JSON response.');
        return;
      }

      if (!res.ok) {
        showErrorPill(data.error || 'Server error occurred during processing.');
        return;
      }

      if (data.is_medical) {
        showSuccessPill('Medical report verified & saved');
        state.activeSubTab = 'test_report';
        dom.goToReportsBtn.classList.remove('hidden');
        renderMedicalResult(data);
      } else {
        showErrorPill('Not a medical document');
        renderRejection(data);
      }
    } catch (err) {
      clearTimeout(abortTimeout);
      stopTimer();
      dom.processingBanner.classList.add('hidden');
      state.processing = false;
      updateProcessBtnState();

      if (err.name === 'AbortError') {
        showErrorPill('Processing timed out (file may be too dense for CPU OCR).');
      } else {
        showErrorPill('Could not connect to OCR server. Is the backend running?');
      }
    }
  }

  // ─── Render Rejection & Inline Result ────────────────────────────
  function renderRejection(data) {
    dom.rejectionReason.textContent = data.rejection_reason || 'The uploaded file does not contain recognisable medical content.';
    if (data.metadata) {
      dom.rejectionMeta.textContent = `OCR Confidence: ${data.metadata.ocr_confidence} · Pages: ${data.metadata.page_count} · File Type: ${data.metadata.file_type}`;
      dom.rejectionMeta.style.display = 'block';
    } else {
      dom.rejectionMeta.style.display = 'none';
    }
    dom.rejectionBanner.classList.remove('hidden');
  }

  function renderMedicalResult(data) {
    const meta = data.metadata || {};
    dom.resultFilename.textContent = meta.filename || state.currentFile.name;
    dom.resultDocType.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> ${escapeHtml(data.document_type || 'General Medical Report')}`;
    dom.resultConf.textContent = `OCR ${meta.ocr_confidence || '95%'}`;

    setFieldValue(dom.metaPatient, data.patient_name);
    setFieldValue(dom.metaAge, data.patient_age);
    setFieldValue(dom.metaSex, data.patient_sex);
    setFieldValue(dom.metaDate, data.date);
    setFieldValue(dom.metaFacility, data.facility);
    setFieldValue(dom.metaDoctor, data.doctor);

    setFieldValue(dom.metaFileType, meta.file_type);
    setFieldValue(dom.metaFileSize, meta.file_size_kb ? meta.file_size_kb + ' KB' : null);
    setFieldValue(dom.metaPages, meta.page_count);
    setFieldValue(dom.metaOcrConf, meta.ocr_confidence);

    if (data.findings) {
      dom.findingsText.textContent = data.findings;
      dom.findingsSection.style.display = 'block';
    } else {
      dom.findingsSection.style.display = 'none';
    }

    if (data.disease_summary) {
      dom.diagnosisText.textContent = data.disease_summary;
      dom.diagnosisSection.style.display = 'block';
    } else {
      dom.diagnosisSection.style.display = 'none';
    }

    const labs = data.test_results || [];
    if (labs.length > 0) {
      dom.labTbody.innerHTML = labs.map(r => `
        <tr>
          <td><strong>${escapeHtml(r.parameter)}</strong></td>
          <td>${escapeHtml(r.value)}</td>
          <td>${escapeHtml(r.unit || '—')}</td>
          <td>${escapeHtml(r.reference_range || '—')}</td>
        </tr>
      `).join('');
      dom.labSection.style.display = 'block';
    } else {
      dom.labSection.style.display = 'none';
    }

    dom.rawText.textContent = data.raw_text || '';
    dom.rawText.classList.add('hidden');
    dom.debugToggle.classList.remove('open');
    dom.resultCard.classList.remove('hidden');
  }

  function setFieldValue(element, value) {
    if (!element) return;
    if (value && String(value).trim()) {
      element.textContent = value;
      element.classList.remove('empty');
    } else {
      element.textContent = '—';
      element.classList.add('empty');
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // MEDICAL REPORTS TAB: FETCH, FILTER, GROUP BY MONTH & DATE RANGE
  // ══════════════════════════════════════════════════════════════════

  async function fetchAndRenderRecords() {
    if (state.backendOnline === false) {
      dom.reportsContainer.innerHTML = `
        <div class="reports-placeholder">
          <h3>Backend is offline</h3>
          <p>Start the Python server on port 5001 to load your saved medical reports.</p>
        </div>`;
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/records`);
      if (!res.ok) throw new Error('Failed to fetch records');
      const data = await res.json();
      state.allRecords = data.records || [];

      updateSubTabCounts();
      syncSubTabUI();
      populateFilterDropdowns();
      renderFilteredReports();
    } catch {
      dom.reportsContainer.innerHTML = `
        <div class="reports-placeholder">
          <h3>Could not load reports</h3>
          <p>Ensure the Flask backend is running on http://localhost:5001.</p>
        </div>`;
    }
  }

  function updateSubTabCounts() {
    const testCount = state.allRecords.filter(r => r.category === 'test_report').length;
    const rxCount = state.allRecords.filter(r => r.category === 'prescription').length;
    dom.countTestReports.textContent = testCount;
    dom.countPrescriptions.textContent = rxCount;
  }

  function syncSubTabUI() {
    dom.subtabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === state.activeSubTab);
    });
  }

  function switchSubTab(subtab) {
    state.activeSubTab = subtab;
    syncSubTabUI();
    populateFilterDropdowns();
    renderFilteredReports();
  }

  function populateFilterDropdowns() {
    const categoryRecords = state.allRecords.filter(r => r.category === state.activeSubTab);

    const prevHosp = dom.filterHospital.value;
    const prevDoc = dom.filterDoctor.value;
    const prevMonth = dom.filterMonth.value;

    const hospitals = [...new Set(categoryRecords.map(r => r.facility).filter(Boolean))].sort();
    const doctors = [...new Set(categoryRecords.map(r => r.doctor).filter(Boolean))].sort();
    const months = [...new Set(categoryRecords.map(r => (r.iso_date || '').slice(0, 7)).filter(m => /^\d{4}-\d{2}$/.test(m)))].sort().reverse();

    dom.filterHospital.innerHTML = `<option value="">All Hospitals / Clinics</option>` +
      hospitals.map(h => `<option value="${escapeHtml(h)}">${escapeHtml(h)}</option>`).join('');

    dom.filterDoctor.innerHTML = `<option value="">All Doctors</option>` +
      doctors.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');

    dom.filterMonth.innerHTML = `<option value="">All Months</option>` +
      months.map(ym => `<option value="${ym}">${escapeHtml(formatMonthLabel(ym))}</option>`).join('');

    if (hospitals.includes(prevHosp)) dom.filterHospital.value = prevHosp;
    if (doctors.includes(prevDoc)) dom.filterDoctor.value = prevDoc;
    if (months.includes(prevMonth)) dom.filterMonth.value = prevMonth;
  }

  function formatMonthLabel(ym) {
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return 'Unknown Month';
    const [y, m] = ym.split('-').map(Number);
    const dt = new Date(y, m - 1, 1);
    return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function getDateRangeBucket(isoDate) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      return { key: '00', label: 'Undated', order: 0 };
    }
    const [y, m, d] = isoDate.split('-').map(Number);
    const monthShort = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    const lastDay = new Date(y, m, 0).getDate();

    if (d <= 7) {
      return { key: '1', label: `${monthShort} 01 – ${monthShort} 07`, order: 1 };
    } else if (d <= 14) {
      return { key: '2', label: `${monthShort} 08 – ${monthShort} 14`, order: 2 };
    } else if (d <= 21) {
      return { key: '3', label: `${monthShort} 15 – ${monthShort} 21`, order: 3 };
    } else {
      return { key: '4', label: `${monthShort} 22 – ${monthShort} ${lastDay}`, order: 4 };
    }
  }

  function renderFilteredReports() {
    const query = dom.filterSearch.value.trim().toLowerCase();
    const hosp = dom.filterHospital.value;
    const doc = dom.filterDoctor.value;
    const month = dom.filterMonth.value;
    const dateFrom = dom.filterDateFrom.value;
    const dateTo = dom.filterDateTo.value;
    const sortDir = dom.filterSort.value; // 'desc' | 'asc'

    let items = state.allRecords.filter(r => r.category === state.activeSubTab);

    if (query) {
      items = items.filter(r => {
        const hay = [
          r.title, r.document_type, r.doctor, r.facility,
          r.patient_name, r.findings, r.disease_summary, r.notes,
          r.original_filename, r.display_date
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(query);
      });
    }

    if (hosp) items = items.filter(r => r.facility === hosp);
    if (doc) items = items.filter(r => r.doctor === doc);
    if (month) items = items.filter(r => (r.iso_date || '').startsWith(month));
    if (dateFrom) items = items.filter(r => (r.iso_date || '') >= dateFrom);
    if (dateTo) items = items.filter(r => (r.iso_date || '') <= dateTo);

    // Sort by date
    items.sort((a, b) => {
      const da = (a.iso_date || '') + (a.created_at || '');
      const db = (b.iso_date || '') + (b.created_at || '');
      return sortDir === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
    });

    if (items.length === 0) {
      const label = state.activeSubTab === 'prescription' ? 'prescriptions' : 'test reports';
      dom.reportsContainer.innerHTML = `
        <div class="reports-placeholder">
          <div class="reports-placeholder-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>No ${label} found</h3>
          <p>Upload a document in the Upload tab or adjust your search and filter criteria.</p>
        </div>`;
      return;
    }

    // Group by Month -> Sub-group by Date Range
    const monthMap = new Map();
    for (const item of items) {
      const ym = (item.iso_date || '').slice(0, 7) || 'unknown';
      if (!monthMap.has(ym)) monthMap.set(ym, new Map());

      const bucket = getDateRangeBucket(item.iso_date);
      const subMap = monthMap.get(ym);
      if (!subMap.has(bucket.key)) {
        subMap.set(bucket.key, { label: bucket.label, order: bucket.order, items: [] });
      }
      subMap.get(bucket.key).items.push(item);
    }

    const htmlParts = [];
    for (const [ym, subMap] of monthMap.entries()) {
      const totalInMonth = Array.from(subMap.values()).reduce((sum, g) => sum + g.items.length, 0);
      const subgroups = Array.from(subMap.values()).sort((a, b) =>
        sortDir === 'asc' ? a.order - b.order : b.order - a.order
      );

      const subgroupsHtml = subgroups.map(sg => `
        <div class="daterange-subgroup">
          <div class="daterange-header">
            <span>${escapeHtml(sg.label)}</span>
            <span class="daterange-count">(${sg.items.length})</span>
          </div>
          <div class="cards-grid">
            ${sg.items.map(renderReportCard).join('')}
          </div>
        </div>
      `).join('');

      htmlParts.push(`
        <div class="month-group">
          <div class="month-header">
            <span class="month-title">${escapeHtml(formatMonthLabel(ym))}</span>
            <span class="group-badge">${totalInMonth} ${totalInMonth === 1 ? 'item' : 'items'}</span>
          </div>
          ${subgroupsHtml}
        </div>
      `);
    }

    dom.reportsContainer.innerHTML = htmlParts.join('');
  }

  function renderReportCard(r) {
    const isRx = r.category === 'prescription';
    const badgeLabel = isRx ? 'Prescription' : (r.document_type || 'Test Report');
    const title = r.title || r.document_type || r.original_filename;

    return `
      <article class="report-card" data-id="${escapeHtml(r.id)}">
        <div class="report-card-top">
          <span class="report-type-pill ${isRx ? 'rx' : ''}">${escapeHtml(badgeLabel)}</span>
          <span class="report-date-pill">${escapeHtml(r.display_date || r.iso_date || '—')}</span>
        </div>

        <h4 class="report-card-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h4>

        <div class="report-card-meta">
          <div class="rc-meta-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span class="rc-meta-label">Doctor:</span>
            <span>${escapeHtml(r.doctor || 'Not specified')}</span>
          </div>
          <div class="rc-meta-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2" width="18" height="20" rx="1"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="9" y1="9" x2="15" y2="9"/></svg>
            <span class="rc-meta-label">Hospital/Clinic:</span>
            <span>${escapeHtml(r.facility || 'Not specified')}</span>
          </div>
        </div>

        <div class="report-card-actions">
          <button type="button" class="btn-show-details" data-action="details" data-id="${escapeHtml(r.id)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Show Details
          </button>
          <button type="button" class="btn-delete-card" data-action="delete" data-id="${escapeHtml(r.id)}" title="Delete record">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </article>
    `;
  }

  // ══════════════════════════════════════════════════════════════════
  // BIG SPLIT-VIEW DETAILS MODAL
  // ══════════════════════════════════════════════════════════════════

  function openDetailModal(recordId) {
    const rec = state.allRecords.find(r => r.id === recordId);
    if (!rec) return;

    const isRx = rec.category === 'prescription';
    const fileUrl = `${API_BASE}${rec.file_url}`;

    dom.modalBadge.textContent = isRx ? 'Prescription' : (rec.document_type || 'Test Report');
    dom.modalTitle.textContent = rec.title || rec.document_type || rec.original_filename;
    dom.modalDate.textContent = rec.display_date || rec.iso_date || '';
    dom.modalOpenNewTab.href = fileUrl;

    // Left Pane: Original Uploaded Document Viewer
    if (isImageFilename(rec.stored_filename || rec.original_filename)) {
      dom.modalDocViewer.innerHTML = `<img src="${escapeHtml(fileUrl)}" alt="${escapeHtml(rec.original_filename)}" />`;
    } else {
      dom.modalDocViewer.innerHTML = `<iframe src="${escapeHtml(fileUrl)}" title="Original PDF Document"></iframe>`;
    }

    // Right Pane: Details
    const meta = rec.metadata || {};
    const labs = rec.test_results || [];

    let rightHtml = `
      <div class="result-section-title">Clinical &amp; Patient Details</div>
      <div class="meta-grid" style="grid-template-columns: repeat(2, 1fr);">
        <div class="meta-item">
          <div class="meta-label">Test / Document</div>
          <div class="meta-value">${escapeHtml(rec.document_type || rec.title || '—')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Date</div>
          <div class="meta-value">${escapeHtml(rec.display_date || rec.iso_date || '—')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Doctor / Consultant</div>
          <div class="meta-value ${!rec.doctor ? 'empty' : ''}">${escapeHtml(rec.doctor || '—')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Hospital / Clinic</div>
          <div class="meta-value ${!rec.facility ? 'empty' : ''}">${escapeHtml(rec.facility || '—')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Patient Name</div>
          <div class="meta-value ${!rec.patient_name ? 'empty' : ''}">${escapeHtml(rec.patient_name || '—')}</div>
        </div>
        ${!isRx ? `
        <div class="meta-item">
          <div class="meta-label">Age / Sex</div>
          <div class="meta-value ${(!rec.patient_age && !rec.patient_sex) ? 'empty' : ''}">
            ${escapeHtml([rec.patient_age, rec.patient_sex].filter(Boolean).join(' · ') || '—')}
          </div>
        </div>` : ''}
      </div>

      <hr class="meta-divider" />
      <div class="result-section-title">File Metadata</div>
      <div class="meta-grid" style="grid-template-columns: repeat(2, 1fr);">
        <div class="meta-item">
          <div class="meta-label">Original Filename</div>
          <div class="meta-value" style="word-break:break-all;">${escapeHtml(rec.original_filename || '—')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Type &amp; Size</div>
          <div class="meta-value">${escapeHtml(meta.file_type || '—')} · ${escapeHtml(meta.file_size_kb ? meta.file_size_kb + ' KB' : '—')}</div>
        </div>
      </div>
    `;

    if (rec.notes) {
      rightHtml += `
        <hr class="meta-divider" />
        <div class="result-section-title">Prescription Notes</div>
        <div class="findings-block">${escapeHtml(rec.notes)}</div>
      `;
    }

    if (rec.findings) {
      rightHtml += `
        <hr class="meta-divider" />
        <div class="result-section-title">Findings / Observations</div>
        <div class="findings-block">${escapeHtml(rec.findings)}</div>
      `;
    }

    if (rec.disease_summary) {
      rightHtml += `
        <div class="result-section-title">Clinical Summary / Diagnosis</div>
        <div class="diagnosis-block">${escapeHtml(rec.disease_summary)}</div>
      `;
    }

    if (labs.length > 0) {
      rightHtml += `
        <hr class="meta-divider" />
        <div class="result-section-title">Extracted Lab Parameters</div>
        <div class="lab-table-wrap">
          <table class="lab-table">
            <thead>
              <tr><th>Parameter</th><th>Value</th><th>Unit</th><th>Ref. Range</th></tr>
            </thead>
            <tbody>
              ${labs.map(r => `
                <tr>
                  <td><strong>${escapeHtml(r.parameter)}</strong></td>
                  <td>${escapeHtml(r.value)}</td>
                  <td>${escapeHtml(r.unit || '—')}</td>
                  <td>${escapeHtml(r.reference_range || '—')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    if (rec.raw_text) {
      rightHtml += `
        <hr class="meta-divider" />
        <div class="result-section-title">Raw Extracted Text</div>
        <pre class="raw-text-block">${escapeHtml(rec.raw_text)}</pre>
      `;
    }

    dom.modalDetailsContent.innerHTML = rightHtml;
    dom.detailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailModal() {
    dom.detailModal.classList.add('hidden');
    dom.modalDocViewer.innerHTML = '';
    document.body.style.overflow = '';
  }

  async function deleteRecordById(recordId) {
    if (!confirm('Remove this document from Medical Reports?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/records/${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchAndRenderRecords();
      }
    } catch {
      alert('Failed to delete record.');
    }
  }

  // ─── Event Listeners Setup ───────────────────────────────────────
  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('sasthoshohoj-theme', next);
  }

  function initEvents() {
    // Theme toggle
    if (dom.themeToggleBtn) {
      dom.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Backend guide toggle
    dom.statusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleOfflineGuide();
    });
    dom.statusOverlay.addEventListener('click', closeOfflineGuide);
    dom.retryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setBackendStatus(null);
      checkBackendHealth();
    });

    // Main Tabs
    dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Upload Mode Cards
    dom.modeCards.forEach(card => {
      card.addEventListener('click', () => setUploadMode(card.dataset.mode));
    });

    // Quick jump to Medical Reports
    dom.goToReportsBtn.addEventListener('click', () => switchTab('reports'));

    // Browse & Drag/Drop
    dom.dropZone.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleFileSelected(e.target.files[0]);
    });

    ['dragenter', 'dragover'].forEach(ev => {
      dom.dropZone.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        dom.dropZone.classList.add('dragging');
      });
    });
    ['dragleave', 'drop'].forEach(ev => {
      dom.dropZone.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        dom.dropZone.classList.remove('dragging');
      });
    });
    dom.dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });

    dom.removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeCurrentFile();
    });

    dom.processBtn.addEventListener('click', handleUploadSubmit);

    // Inline Debug Raw text toggle
    dom.debugToggle.addEventListener('click', () => {
      const isHidden = dom.rawText.classList.contains('hidden');
      dom.rawText.classList.toggle('hidden', !isHidden);
      dom.debugToggle.classList.toggle('open', isHidden);
      dom.debugToggle.querySelector('span').textContent = isHidden
        ? 'Hide raw OCR text (debug)'
        : 'Show raw OCR text (debug)';
    });

    // Medical Reports Sub-tabs
    dom.subtabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchSubTab(btn.dataset.subtab));
    });

    // Filters & Search
    [dom.filterSearch, dom.filterHospital, dom.filterDoctor, dom.filterMonth,
     dom.filterDateFrom, dom.filterDateTo, dom.filterSort].forEach(el => {
      el.addEventListener('input', renderFilteredReports);
      el.addEventListener('change', renderFilteredReports);
    });

    dom.clearFiltersBtn.addEventListener('click', () => {
      dom.filterSearch.value = '';
      dom.filterHospital.value = '';
      dom.filterDoctor.value = '';
      dom.filterMonth.value = '';
      dom.filterDateFrom.value = '';
      dom.filterDateTo.value = '';
      dom.filterSort.value = 'desc';
      renderFilteredReports();
    });

    // Card Actions (Show Details / Delete via Event Delegation)
    dom.reportsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === 'details') openDetailModal(id);
      if (action === 'delete') deleteRecordById(id);
    });

    // Modal Close
    dom.modalCloseBtn.addEventListener('click', closeDetailModal);
    dom.detailModal.addEventListener('click', (e) => {
      if (e.target === dom.detailModal) closeDetailModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dom.detailModal.classList.contains('hidden')) {
        closeDetailModal();
      }
    });
  }

  // ─── Initialization ──────────────────────────────────────────────
  initEvents();
  checkBackendHealth();
  setInterval(checkBackendHealth, 8000);

})();

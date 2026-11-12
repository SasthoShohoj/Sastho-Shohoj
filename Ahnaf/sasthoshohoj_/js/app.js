/**
 * SasthoShohoj — Vanilla JavaScript Frontend
 * ─────────────────────────────────────────────────────────────────
 * Handles:
 *  - Backend health monitoring & offline setup guide
 *  - Tab navigation (Upload Document / Medical Reports)
 *  - Drag & drop file uploads (PDF & Image formats)
 *  - Live image previews
 *  - POST to Python OCR backend (/api/process)
 *  - Multi-stage medical validation & structured report rendering
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
    // Backend status
    statusBtn:      document.getElementById('statusBtn'),
    statusDot:      document.getElementById('statusDot'),
    statusText:     document.getElementById('statusText'),
    statusChevron:  document.getElementById('statusChevron'),
    offlineGuide:   document.getElementById('offlineGuide'),
    statusOverlay:  document.getElementById('statusOverlay'),
    retryBtn:       document.getElementById('retryBtn'),

    // Tabs
    tabBtns:        document.querySelectorAll('.tab-btn'),
    tabUpload:      document.getElementById('tabUpload'),
    tabReports:     document.getElementById('tabReports'),

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

    // Banners
    processingBanner: document.getElementById('processingBanner'),
    rejectionBanner:  document.getElementById('rejectionBanner'),
    rejectionReason:  document.getElementById('rejectionReason'),
    rejectionMeta:    document.getElementById('rejectionMeta'),

    // Results Card
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
  };

  // ─── State ───────────────────────────────────────────────────────
  const state = {
    backendOnline: null, // null (checking) | true | false
    currentFile: null,
    previewUrl: null,
    processing: false,
    activeTab: 'upload',
  };

  // ─── Helpers ─────────────────────────────────────────────────────
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function escapeHtml(str) {
    if (!str) return '';
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
    return file.type.startsWith('image/') || /\.(jpg|jpeg|png|tiff|tif|bmp|webp)$/.test(name);
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
    state.backendOnline = online;

    dom.statusBtn.className = 'backend-status-btn';
    dom.statusDot.className = 'status-dot';

    if (online === true) {
      dom.statusBtn.classList.add('online');
      dom.statusDot.classList.add('online');
      dom.statusText.textContent = 'Backend Online';
      dom.statusChevron.style.display = 'none';
      closeOfflineGuide();
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

  // ─── Tab Switching ───────────────────────────────────────────────
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
    }
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

    // Clear previous results
    clearResults();
    hideErrorPill();

    state.currentFile = file;

    // Update File Strip
    dom.fileName.textContent = file.name;
    dom.fileSize.textContent = formatBytes(file.size);
    dom.fileStrip.classList.remove('hidden');

    // Image preview
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = null;
    }

    if (isImageFile(file)) {
      state.previewUrl = URL.createObjectURL(file);
      dom.previewImg.src = state.previewUrl;
      dom.previewWrap.classList.remove('hidden');
      dom.fileIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    } else {
      dom.previewWrap.classList.add('hidden');
      dom.fileIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
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
    updateProcessBtnState();
  }

  function updateProcessBtnState() {
    const canProcess = Boolean(state.currentFile) && state.backendOnline === true && !state.processing;
    dom.processBtn.disabled = !canProcess;

    if (!state.currentFile) {
      dom.processBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 7 4"/><polyline points="17 4 20 4 20 7"/><polyline points="20 17 20 20 17 20"/><polyline points="7 20 4 20 4 17"/><line x1="4" y1="12" x2="20" y2="12"/></svg> Analyse Document`;
    }
  }

  function clearResults() {
    dom.resultCard.classList.add('hidden');
    dom.rejectionBanner.classList.add('hidden');
    dom.processingBanner.classList.add('hidden');
    dom.rawText.classList.add('hidden');
    dom.debugToggle.classList.remove('open');
  }

  function showErrorPill(msg) {
    dom.processPill.className = 'status-pill error';
    dom.processPill.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${escapeHtml(msg)}`;
    dom.processPill.style.display = 'inline-flex';
  }

  function showSuccessPill(msg) {
    dom.processPill.className = 'status-pill success';
    dom.processPill.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ${escapeHtml(msg)}`;
    dom.processPill.style.display = 'inline-flex';
  }

  function hideErrorPill() {
    dom.processPill.style.display = 'none';
  }

  // ─── Analyse & Process Document ──────────────────────────────────
  async function analyseDocument() {
    if (!state.currentFile || state.backendOnline !== true || state.processing) return;

    state.processing = true;
    updateProcessBtnState();
    clearResults();
    hideErrorPill();

    dom.processBtn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Processing…`;
    dom.processingBanner.classList.remove('hidden');

    try {
      const formData = new FormData();
      formData.append('file', state.currentFile);

      const res = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      dom.processingBanner.classList.add('hidden');
      state.processing = false;
      updateProcessBtnState();

      if (!res.ok) {
        showErrorPill(data.error || 'Server error occurred during processing.');
        return;
      }

      if (data.is_medical) {
        showSuccessPill('Medical document confirmed');
        renderMedicalResult(data);
      } else {
        showErrorPill('Not a medical document');
        renderRejection(data);
      }
    } catch (err) {
      dom.processingBanner.classList.add('hidden');
      state.processing = false;
      updateProcessBtnState();
      showErrorPill('Could not connect to OCR server. Is the backend running?');
    }
  }

  // ─── Render Rejection Banner ─────────────────────────────────────
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

  // ─── Render Structured Medical Results ───────────────────────────
  function renderMedicalResult(data) {
    const meta = data.metadata || {};

    // Header info
    dom.resultFilename.textContent = meta.filename || state.currentFile.name;
    dom.resultDocType.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style="width:14px;height:14px"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> ${escapeHtml(data.document_type || 'General Medical Report')}`;
    dom.resultConf.textContent = `OCR ${meta.ocr_confidence || '95%'}`;

    // Patient info fields
    setFieldValue(dom.metaPatient, data.patient_name);
    setFieldValue(dom.metaAge, data.patient_age);
    setFieldValue(dom.metaSex, data.patient_sex);
    setFieldValue(dom.metaDate, data.date);
    setFieldValue(dom.metaFacility, data.facility);
    setFieldValue(dom.metaDoctor, data.doctor);

    // File metadata
    setFieldValue(dom.metaFileType, meta.file_type);
    setFieldValue(dom.metaFileSize, meta.file_size_kb ? meta.file_size_kb + ' KB' : null);
    setFieldValue(dom.metaPages, meta.page_count);
    setFieldValue(dom.metaOcrConf, meta.ocr_confidence);

    // Findings
    if (data.findings) {
      dom.findingsText.textContent = data.findings;
      dom.findingsSection.style.display = 'block';
    } else {
      dom.findingsSection.style.display = 'none';
    }

    // Clinical Summary / Diagnosis
    if (data.disease_summary) {
      dom.diagnosisText.textContent = data.disease_summary;
      dom.diagnosisSection.style.display = 'block';
    } else {
      dom.diagnosisSection.style.display = 'none';
    }

    // Lab Values Table
    const labs = data.test_results || [];
    if (labs.length > 0) {
      dom.labTbody.innerHTML = labs.map(r => `
        <tr>
          <td>${escapeHtml(r.parameter)}</td>
          <td><strong>${escapeHtml(r.value)}</strong></td>
          <td>${escapeHtml(r.unit || '—')}</td>
          <td>${escapeHtml(r.reference_range || '—')}</td>
        </tr>
      `).join('');
      dom.labSection.style.display = 'block';
    } else {
      dom.labSection.style.display = 'none';
    }

    // Raw text debug block
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

  // ─── Event Listeners Setup ───────────────────────────────────────
  function initEvents() {
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

    // Tab buttons
    dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Browse click
    dom.dropZone.addEventListener('click', () => dom.fileInput.click());

    dom.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelected(e.target.files[0]);
      }
    });

    // Drag and drop
    ['dragenter', 'dragover'].forEach(eventName => {
      dom.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dom.dropZone.classList.add('dragging');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dom.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dom.dropZone.classList.remove('dragging');
      });
    });

    dom.dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });

    // Remove file
    dom.removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeCurrentFile();
    });

    // Process button
    dom.processBtn.addEventListener('click', analyseDocument);

    // Raw text toggle
    dom.debugToggle.addEventListener('click', () => {
      const isHidden = dom.rawText.classList.contains('hidden');
      if (isHidden) {
        dom.rawText.classList.remove('hidden');
        dom.debugToggle.classList.add('open');
        dom.debugToggle.querySelector('span').textContent = 'Hide raw OCR text (debug)';
      } else {
        dom.rawText.classList.add('hidden');
        dom.debugToggle.classList.remove('open');
        dom.debugToggle.querySelector('span').textContent = 'Show raw OCR text (debug)';
      }
    });
  }

  // ─── Initialization ──────────────────────────────────────────────
  initEvents();
  checkBackendHealth();
  setInterval(checkBackendHealth, 8000);

})();

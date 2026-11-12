import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

const API = 'http://localhost:5001'

/* ══════════════════════════════════════════════════════════════════
   SVG ICONS  (inline, zero-dependency)
══════════════════════════════════════════════════════════════════ */
const IC = (d) => () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">{d}</svg>
)
const IconHeart       = IC(<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>)
const IconUpload      = IC(<><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>)
const IconFile        = IC(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>)
const IconImage       = IC(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>)
const IconX           = IC(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>)
const IconScan        = IC(<><polyline points="4 7 4 4 7 4"/><polyline points="17 4 20 4 20 7"/><polyline points="20 17 20 20 17 20"/><polyline points="7 20 4 20 4 17"/><line x1="4" y1="12" x2="20" y2="12"/></>)
const IconCheck       = IC(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>)
const IconClipboard   = IC(<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></>)
const IconFolder      = IC(<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>)
const IconAlert       = IC(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>)
const IconActivity    = IC(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>)
const IconUser        = IC(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>)
const IconCalendar    = IC(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>)
const IconHospital    = IC(<><rect x="3" y="2" width="18" height="20" rx="1"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="9" y1="9" x2="15" y2="9"/></>)
const IconChevron     = IC(<polyline points="6 9 12 15 18 9"/>)
const IconFlask       = IC(<><path d="M9 3h6v8l3.5 7A2 2 0 0 1 16.72 21H7.28a2 2 0 0 1-1.78-2.97L9 11V3z"/><line x1="9" y1="3" x2="15" y2="3"/></>)

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
const fmtBytes = (b) =>
  b < 1024 ? b + ' B' : b < 1048576 ? (b/1024).toFixed(1)+' KB' : (b/1048576).toFixed(1)+' MB'

const isImageFile = (f) => f?.type?.startsWith('image/')

const ACCEPT = 'application/pdf,image/jpeg,image/jpg,image/png,image/tiff,image/bmp,image/webp'

function val(v, fallback = '—') {
  if (v === null || v === undefined || v === '') return fallback
  return v
}

/* ══════════════════════════════════════════════════════════════════
   BACKEND HEALTH CHECK  (polls every 8 s, retries on demand)
══════════════════════════════════════════════════════════════════ */
function useBackendStatus() {
  const [online, setOnline] = useState(null)   // null=checking, true, false
  const check = useCallback(() => {
    setOnline(null)   // briefly "checking" on manual retry
    fetch(`${API}/api/health`, { signal: AbortSignal.timeout(3000) })
      .then(r => setOnline(r.ok))
      .catch(() => setOnline(false))
  }, [])
  useEffect(() => {
    check()
    const id = setInterval(check, 8000)
    return () => clearInterval(id)
  }, [check])
  return { online, retry: check }
}

/* ══════════════════════════════════════════════════════════════════
   BACKEND STATUS WIDGET  (top-right, with offline guide dropdown)
══════════════════════════════════════════════════════════════════ */

const SETUP_STEPS = [
  {
    label: 'Open a terminal in the backend folder',
    cmd:   'cd sasthoshohoj_/backend',
    note:  'Or open the folder directly in VS Code terminal.',
  },
  {
    label: 'Install Python dependencies (first time only)',
    cmd:   'pip install -r requirements.txt',
    note:  'EasyOCR will download model weights (~200 MB) on first run.',
  },
  {
    label: 'Start the Flask server',
    cmd:   'python app.py',
    note:  'Server starts on http://localhost:5001 — keep this terminal open.',
  },
]

function BackendStatusWidget({ online, onRetry }) {
  const [open, setOpen] = useState(false)

  const stateKey = online === null ? 'checking' : online ? 'online' : 'offline'
  const labels   = { checking: 'Checking…', online: 'Backend Online', offline: 'Backend Offline' }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [open])

  function handleBtnClick(e) {
    e.stopPropagation()
    if (stateKey === 'offline') setOpen(o => !o)
  }

  function handleRetry(e) {
    e.stopPropagation()
    onRetry()
  }

  return (
    <div className="backend-status-widget">
      <button
        className={`backend-status-btn ${stateKey}`}
        onClick={handleBtnClick}
        title={stateKey === 'offline' ? 'Click for setup instructions' : undefined}
      >
        <span className="status-indicator">
          <span className={`status-dot ${stateKey}`} />
          {labels[stateKey]}
        </span>
        {stateKey === 'offline' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round"
               style={{ width: 13, height: 13, marginLeft: 2 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        )}
      </button>

      {open && stateKey === 'offline' && (
        <>
          <div className="status-overlay" onClick={() => setOpen(false)} />
          <div className="offline-guide" onClick={e => e.stopPropagation()}>
            <div className="offline-guide-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <h4>Backend not running</h4>
                <p>Follow these steps to start the OCR server</p>
              </div>
            </div>

            <div className="offline-guide-body">
              <ol className="offline-steps">
                {SETUP_STEPS.map((s, i) => (
                  <li key={i} className="offline-step">
                    <span className="step-num">{i + 1}</span>
                    <div className="step-content">
                      <div className="step-label">{s.label}</div>
                      <div className="step-cmd">
                        <span>{s.cmd}</span>
                      </div>
                      {s.note && <div className="step-note">{s.note}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="offline-guide-footer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 12 12 14 14"/>
              </svg>
              Checks every 8 s automatically
              <button className="retry-btn" onClick={handleRetry}>
                Retry now
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function UploadTab({ backendOnline }) {
  const [file,     setFile]     = useState(null)
  const [preview,  setPreview]  = useState(null)   // object URL for images
  const [dragging, setDragging] = useState(false)
  const [status,   setStatus]   = useState('idle') // idle|processing|done|rejected|error
  const [result,   setResult]   = useState(null)
  const [errMsg,   setErrMsg]   = useState('')
  const [showRaw,  setShowRaw]  = useState(false)
  const inputRef = useRef()

  function pickFile(f) {
    if (!f) return
    const ok = ACCEPT.split(',').some(t =>
      f.type === t || f.name.toLowerCase().endsWith(t.replace('image/', '.').replace('application/', '.'))
    )
    if (!ok) { setErrMsg('Unsupported format. Use PDF, JPG, PNG, TIFF, BMP or WebP.'); return }
    setFile(f)
    setStatus('idle')
    setResult(null)
    setErrMsg('')
    setShowRaw(false)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(isImageFile(f) ? URL.createObjectURL(f) : null)
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null); setPreview(null); setStatus('idle')
    setResult(null); setErrMsg(''); setShowRaw(false)
  }

  async function handleProcess() {
    if (!file || !backendOnline) return
    setStatus('processing')
    setResult(null)
    setShowRaw(false)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API}/api/process`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setErrMsg(data.error || 'Server error'); setStatus('error'); return }
      setResult(data)
      setStatus(data.is_medical ? 'done' : 'rejected')
    } catch (e) {
      setErrMsg('Could not reach the backend. Is the server running?')
      setStatus('error')
    }
  }

  const isImg = isImageFile(file)

  return (
    <>
      <h2 className="section-title">Document Upload</h2>
      <p className="section-desc">
        Upload a scanned / printed PDF or image — the backend validates whether it's a medical
        document and extracts structured data from it.
      </p>

      {/* Drop zone */}
      <div
        className={`upload-card${dragging ? ' dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]) }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept={ACCEPT}
          onChange={e => pickFile(e.target.files[0])}
          onClick={e => e.stopPropagation()} />
        <div className="upload-icon">{isImg ? <IconImage /> : <IconUpload />}</div>
        <p className="upload-label">Drop your document here</p>
        <p className="upload-hint"><span>Click to browse</span> &nbsp;· PDF or image</p>
        <div className="upload-formats">
          {['PDF','JPG','PNG','TIFF','BMP','WebP'].map(f => (
            <span key={f} className="fmt-badge">{f}</span>
          ))}
        </div>
      </div>

      {/* File strip */}
      {file && (
        <div className="file-strip">
          <span className="file-strip-icon">{isImg ? <IconImage /> : <IconFile />}</span>
          <div className="file-strip-info">
            <div className="file-strip-name">{file.name}</div>
            <div className="file-strip-size">{fmtBytes(file.size)}</div>
          </div>
          <button className="file-strip-remove" onClick={clear}><IconX /></button>
        </div>
      )}

      {/* Image preview */}
      {preview && (
        <div className="preview-image">
          <img src={preview} alt="Preview" />
        </div>
      )}

      {/* Actions */}
      <div className="upload-actions">
        <button
          className="btn-primary"
          disabled={!file || status === 'processing' || !backendOnline}
          onClick={handleProcess}
        >
          <IconScan />
          {status === 'processing' ? 'Processing…' : 'Analyse Document'}
        </button>

        {status === 'done' && (
          <span className="status-pill success"><IconCheck /> Medical document confirmed</span>
        )}
        {status === 'rejected' && (
          <span className="status-pill error"><IconAlert /> Not a medical document</span>
        )}
        {status === 'error' && (
          <span className="status-pill error"><IconAlert /> {errMsg || 'Error'}</span>
        )}
        {!backendOnline && backendOnline !== null && (
          <span className="status-pill error"><IconAlert /> Backend offline</span>
        )}
      </div>

      {/* File format error */}
      {errMsg && status === 'idle' && (
        <div className="rejection-banner" style={{ marginTop: 14 }}>
          <IconAlert />
          <div><div className="rejection-title">Invalid file</div>
          <div className="rejection-reason">{errMsg}</div></div>
        </div>
      )}

      {/* Processing */}
      {status === 'processing' && (
        <div className="processing-banner">
          <div className="spinner" />
          Running EasyOCR — extracting text, then validating medical content…
        </div>
      )}

      {/* Rejection */}
      {status === 'rejected' && result && (
        <div className="rejection-banner">
          <IconAlert />
          <div>
            <div className="rejection-title">Not a recognised medical document</div>
            <div className="rejection-reason">{result.rejection_reason}</div>
            {result.metadata && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red-500)', opacity: 0.8 }}>
                OCR confidence: {result.metadata.ocr_confidence} &nbsp;·&nbsp;
                Pages: {result.metadata.page_count}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result card */}
      {status === 'done' && result && <ResultCard result={result} showRaw={showRaw} setShowRaw={setShowRaw} />}
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   RESULT CARD
══════════════════════════════════════════════════════════════════ */
function ResultCard({ result, showRaw, setShowRaw }) {
  const { metadata, test_results = [] } = result

  return (
    <div className="result-card">
      {/* Header */}
      <div className="result-header">
        <div className="result-header-icon"><IconClipboard /></div>
        <div>
          <h3>Analysis Complete</h3>
          <p>{metadata?.filename}</p>
        </div>
        {metadata?.ocr_confidence && (
          <div className="confidence-badge">OCR {metadata.ocr_confidence}</div>
        )}
      </div>

      {/* Document type badge */}
      <div className="doc-type-tag">
        <IconActivity />
        {val(result.document_type, 'General Medical Report')}
      </div>

      <div className="result-body">

        {/* ── Patient Info ── */}
        <div className="result-section-title">Patient Information</div>
        <div className="meta-grid">
          {[
            [<IconUser />,     'Patient Name',  result.patient_name],
            [<IconUser />,     'Age',           result.patient_age],
            [<IconUser />,     'Sex',           result.patient_sex],
            [<IconCalendar />, 'Date of Test',  result.date],
            [<IconHospital />, 'Facility',      result.facility],
            [<IconUser />,     'Doctor',        result.doctor],
          ].map(([icon, label, value]) => (
            <div className="meta-item" key={label}>
              <div className="meta-label">{label}</div>
              <div className={`meta-value${!value ? ' empty' : ''}`}>{val(value)}</div>
            </div>
          ))}
        </div>

        <hr className="meta-divider" />

        {/* ── File Metadata ── */}
        <div className="result-section-title">File Metadata</div>
        <div className="meta-grid">
          {[
            ['File Type',       metadata?.file_type],
            ['Size',            metadata?.file_size_kb ? metadata.file_size_kb + ' KB' : null],
            ['Pages',           metadata?.page_count],
            ['OCR Confidence',  metadata?.ocr_confidence],
          ].map(([label, value]) => (
            <div className="meta-item" key={label}>
              <div className="meta-label">{label}</div>
              <div className={`meta-value${!value ? ' empty' : ''}`}>{val(value)}</div>
            </div>
          ))}
        </div>

        {/* ── Findings ── */}
        {result.findings && (
          <>
            <hr className="meta-divider" />
            <div className="result-section-title">Findings / Impression</div>
            <div className="findings-block">{result.findings}</div>
          </>
        )}

        {/* ── Disease Summary ── */}
        {result.disease_summary && (
          <>
            <div className="result-section-title">Clinical Summary / Diagnosis</div>
            <div className="findings-block" style={{ background: 'var(--amber-50)', borderColor: 'var(--amber-200)', color: '#78350f' }}>
              {result.disease_summary}
            </div>
          </>
        )}

        {/* ── Lab Results Table ── */}
        {test_results.length > 0 && (
          <>
            <hr className="meta-divider" />
            <div className="result-section-title">Extracted Lab Values</div>
            <div className="lab-table-wrap">
              <table className="lab-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                    <th>Unit</th>
                    <th>Ref. Range</th>
                  </tr>
                </thead>
                <tbody>
                  {test_results.map((r, i) => (
                    <tr key={i}>
                      <td>{r.parameter}</td>
                      <td><strong>{r.value}</strong></td>
                      <td>{r.unit || '—'}</td>
                      <td>{r.reference_range || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Raw OCR Text (debug collapsible) ── */}
        {result.raw_text && (
          <>
            <hr className="meta-divider" />
            <button className="debug-toggle" onClick={() => setShowRaw(s => !s)}>
              <IconChevron />
              {showRaw ? 'Hide' : 'Show'} raw OCR text (debug)
            </button>
            {showRaw && <pre className="raw-text-block">{result.raw_text}</pre>}
          </>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   REPORTS TAB
══════════════════════════════════════════════════════════════════ */
function ReportsTab() {
  return (
    <>
      <h2 className="section-title">Medical Reports</h2>
      <p className="section-desc">View and manage your processed medical documents.</p>
      <div className="reports-placeholder">
        <div className="reports-placeholder-icon"><IconFolder /></div>
        <h3>No reports yet</h3>
        <p>Processed documents will appear here once report storage is implemented.</p>
        <button className="btn-primary" style={{ margin: '0 auto' }}>
          <IconClipboard />
          Access Medical Reports
        </button>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════
   APP SHELL
══════════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'upload',  label: 'Upload Document',  Icon: IconUpload    },
  { id: 'reports', label: 'Medical Reports',  Icon: IconClipboard },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const { online: backendOnline, retry } = useBackendStatus()

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-logo">
          <div className="navbar-icon"><IconHeart /></div>
          <div className="navbar-brand">
            <span className="navbar-title">SasthoShohoj</span>
            <span className="navbar-subtitle">Medical Document Portal</span>
          </div>
        </div>

        <BackendStatusWidget online={backendOnline} onRetry={retry} />
      </nav>

      <div className="tab-bar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tab-btn${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      <main className="main">
        {activeTab === 'upload'  && <UploadTab backendOnline={backendOnline} />}
        {activeTab === 'reports' && <ReportsTab />}
      </main>
    </div>
  )
}

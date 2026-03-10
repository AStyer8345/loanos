'use client'

import { useState, useRef, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = 'contacts' | 'loans'
type Phase = 'idle' | 'parsing' | 'preview' | 'importing' | 'done'

interface ParseResult {
  columns: string[]
  rows:    string[][]     // first 5 rows (preview)
  count:   number         // total row count in file
  fileType: string
  allRows: Record<string, string>[]  // full dataset keyed by column
}

interface ImportResult {
  imported: number
  skipped:  number
  errors:   Array<{ row: number; name: string; error: string }>
}

interface Props {
  onClose:         () => void
  onImportComplete: () => void
}

// ── Helpers ────────────────────────────────────────────────────────────────
function StatusBadge({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '8px 16px',
      textAlign: 'center',
      minWidth: 80,
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--fg)', fontWeight: 700 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ImportModal({ onClose, onImportComplete }: Props) {
  const [activeTab, setActiveTab]   = useState<Tab>('contacts')
  const [phase, setPhase]           = useState<Phase>('idle')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)
  const [dragOver, setDragOver]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Reset state when tab switches ──────────────────────────────────────
  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab)
    setPhase('idle')
    setParseResult(null)
    setImportResult(null)
    setErrorMsg(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ── Parse uploaded file ────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setErrorMsg(null)
    setPhase('parsing')

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/import/parse', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Parse failed')
        setPhase('idle')
        return
      }

      // Build full keyed rows from raw text (parse route returns columns + preview rows)
      // We re-use the parse route's column list to key the preview rows for the table.
      // The full dataset for import is re-built from the same parse response allRows field
      // if the server sends it, otherwise we note we'll send the file again on confirm.
      // Since parse/route only returns 5-row preview, we store the File and re-parse on confirm.
      setParseResult({ ...data, allRows: [] /* populated on confirm */ })
      setPhase('preview')
    } catch {
      setErrorMsg('Network error — could not reach parse endpoint')
      setPhase('idle')
    }
  }, [])

  // ── Confirm import ─────────────────────────────────────────────────────
  // We re-parse the file to get all rows, then POST to the appropriate route.
  const storedFileRef = useRef<File | null>(null)

  const handleConfirm = useCallback(async () => {
    const file = storedFileRef.current
    if (!file || !parseResult) return

    setPhase('importing')
    setErrorMsg(null)

    try {
      // Step 1: get all rows by re-parsing (parse endpoint returns all rows server-side)
      // We send the file again asking for full rows via a special param.
      const form = new FormData()
      form.append('file', file)
      form.append('full', 'true')   // parse route returns all rows when this is set

      const parseRes = await fetch('/api/import/parse', { method: 'POST', body: form })
      const parseData = await parseRes.json()

      if (!parseRes.ok) {
        setErrorMsg(parseData.error ?? 'Re-parse failed')
        setPhase('preview')
        return
      }

      // Convert rows array → array of keyed objects
      const cols: string[] = parseData.columns
      const rawRows: string[][] = parseData.rows
      const keyedRows = rawRows.map((row: string[]) => {
        const obj: Record<string, string> = {}
        cols.forEach((col, i) => { obj[col] = row[i] ?? '' })
        return obj
      })

      // Step 2: POST to import endpoint
      const endpoint = activeTab === 'contacts' ? '/api/import/contacts' : '/api/import/loans'
      const importRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: keyedRows }),
      })
      const importData: ImportResult = await importRes.json()

      if (!importRes.ok) {
        setErrorMsg((importData as unknown as { error: string }).error ?? 'Import failed')
        setPhase('preview')
        return
      }

      setImportResult(importData)
      setPhase('done')
      onImportComplete()
    } catch {
      setErrorMsg('Network error — import could not complete')
      setPhase('preview')
    }
  }, [activeTab, parseResult, onImportComplete])

  // ── File input / drag handlers ─────────────────────────────────────────
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { storedFileRef.current = f; handleFile(f) }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) { storedFileRef.current = f; handleFile(f) }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        width: '90vw', maxWidth: 720,
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '0.08em', color: 'var(--fg)' }}>
            IMPORT
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 18, lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {(['contacts', 'loans'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => switchTab(tab)} style={{
              flex: 1, padding: '10px 0',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === tab ? '#c9a84c' : 'var(--muted)',
              borderBottom: activeTab === tab ? '2px solid #c9a84c' : '2px solid transparent',
              transition: 'color 0.15s',
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* ── IDLE / DROP ZONE ── */}
          {(phase === 'idle' || phase === 'parsing') && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#c9a84c' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                background: dragOver ? 'rgba(201,168,76,0.04)' : 'transparent',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>⬆</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg)' }}>
                {phase === 'parsing' ? 'Parsing file…' : 'Drop file here or click to browse'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                Supports .csv and Salesforce .xls exports
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />
            </div>
          )}

          {/* ── PREVIEW ── */}
          {phase === 'preview' && parseResult && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 16, flexWrap: 'wrap',
              }}>
                <StatusBadge label="Total rows" value={parseResult.count} />
                <StatusBadge label="Columns"    value={parseResult.columns.length} />
                <StatusBadge label="File type"  value={parseResult.fileType.toUpperCase()} />
              </div>

              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                PREVIEW — first {parseResult.rows.length} rows
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {parseResult.columns.map(col => (
                        <th key={col} style={{
                          textAlign: 'left', padding: '6px 10px',
                          fontFamily: 'var(--font-mono)', fontSize: 10,
                          color: 'var(--muted)', letterSpacing: '0.07em',
                          borderBottom: '1px solid var(--border)',
                          whiteSpace: 'nowrap',
                        }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.rows.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{
                            padding: '6px 10px', color: 'var(--fg)',
                            fontFamily: 'var(--font-mono)', fontSize: 11,
                            maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── IMPORTING ── */}
          {phase === 'importing' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontSize: 13 }}>
                Importing {parseResult?.count ?? ''} rows…
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {phase === 'done' && importResult && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.08em', color: 'var(--fg)', marginBottom: 16 }}>
                IMPORT COMPLETE
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <StatusBadge label="Imported" value={importResult.imported} />
                <StatusBadge label="Skipped"  value={importResult.skipped}  />
                <StatusBadge label="Errors"   value={importResult.errors.length} />
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#e05c5c', fontFamily: 'var(--font-mono)', marginBottom: 8, letterSpacing: '0.07em' }}>
                    ERRORS
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {importResult.errors.map((e, i) => (
                      <div key={i} style={{
                        fontSize: 11, fontFamily: 'var(--font-mono)',
                        color: 'var(--muted)', marginBottom: 4,
                        padding: '4px 8px', background: 'var(--surface)',
                        borderLeft: '3px solid #e05c5c', borderRadius: 2,
                      }}>
                        Row {e.row} — {e.name}: {e.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Error message ── */}
          {errorMsg && (
            <div style={{
              marginTop: 16, padding: '10px 14px',
              background: 'rgba(224,92,92,0.1)', border: '1px solid #e05c5c',
              borderRadius: 4, fontSize: 12, color: '#e05c5c',
              fontFamily: 'var(--font-mono)',
            }}>
              {errorMsg}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 12,
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
        }}>
          {phase === 'done' ? (
            <button onClick={onClose} style={{
              padding: '8px 20px',
              background: '#c9a84c', color: '#000',
              border: 'none', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Close
            </button>
          ) : (
            <>
              <button onClick={onClose} style={{
                padding: '8px 20px',
                background: 'none', color: 'var(--muted)',
                border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                Cancel
              </button>
              {phase === 'preview' && (
                <button onClick={handleConfirm} style={{
                  padding: '8px 24px',
                  background: '#c9a84c', color: '#000',
                  border: 'none', borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  Import {parseResult?.count} rows →
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}

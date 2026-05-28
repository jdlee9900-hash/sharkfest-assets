'use client'

import { useState, useRef, useCallback } from 'react'

interface FileEntry {
  file: File
  takenAt: string | null
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number   // 0–100
  error?: string
}

async function readExifDate(file: File): Promise<string | null> {
  try {
    // Race against a 4-second timeout — some mobile browsers stall on large HEICs
    const withTimeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 4000))
    const read = (async () => {
      const exifr = await import('exifr')
      const result = await exifr.parse(file, ['DateTimeOriginal', 'DateTime', 'CreateDate'])
      const dt: Date | undefined = result?.DateTimeOriginal ?? result?.CreateDate ?? result?.DateTime
      return dt instanceof Date ? dt.toISOString() : null
    })()
    return await Promise.race([read, withTimeout])
  } catch {
    return null
  }
}

/**
 * Upload to Cloudinary using XMLHttpRequest.
 * fetch() silently fails on iOS Safari for large binary FormData payloads;
 * XHR is significantly more reliable for mobile file uploads.
 */
function xhrUpload(
  url: string,
  fd: FormData,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.timeout = 120_000 // 2 min — large RAW/HEIC files on slow connections

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        let msg = 'Upload failed'
        try { msg = JSON.parse(xhr.responseText)?.error?.message ?? msg } catch { /* noop */ }
        reject(new Error(msg))
      }
    }
    xhr.onerror   = () => reject(new Error('Network error — check your connection and try again'))
    xhr.ontimeout = () => reject(new Error('Upload timed out — try a smaller photo or a stronger signal'))
    xhr.send(fd)
  })
}

export function CommunityUpload() {
  const [name,     setName]     = useState('')
  const [entries,  setEntries]  = useState<FileEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const [allDone,  setAllDone]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const patchEntry = useCallback((idx: number, patch: Partial<FileEntry>) => {
    setEntries(prev => prev.map((e, j) => j === idx ? { ...e, ...patch } : e))
  }, [])

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/') || f.name.match(/\.(heic|heif)$/i))
    if (!arr.length) return

    const fresh: FileEntry[] = arr.map(f => ({ file: f, takenAt: null, status: 'pending', progress: 0 }))
    setEntries(prev => [...prev, ...fresh])
    setAllDone(false)

    const dates = await Promise.all(arr.map(readExifDate))
    setEntries(prev => {
      const next = [...prev]
      const start = next.length - arr.length
      for (let i = 0; i < arr.length; i++) {
        next[start + i] = { ...next[start + i], takenAt: dates[i] }
      }
      return next
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const removeEntry = (idx: number) => {
    setEntries(prev => prev.filter((_, i) => i !== idx))
    setAllDone(false)
  }

  const uploadAll = async () => {
    if (!name.trim() || !entries.length) return
    setAllDone(false)

    for (let i = 0; i < entries.length; i++) {
      if (entries[i].status === 'done') continue

      patchEntry(i, { status: 'uploading', progress: 0, error: undefined })

      try {
        // Step 1: get a signed upload token from our server
        let sigData: { timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string; context: string }
        try {
          const sigRes = await fetch('/api/sign-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploaderName: name.trim(), photoTakenAt: entries[i].takenAt ?? '' }),
          })
          if (!sigRes.ok) {
            const body = await sigRes.json().catch(() => ({}))
            throw new Error(body?.error ?? `Server error ${sigRes.status}`)
          }
          sigData = await sigRes.json()
        } catch (err) {
          throw new Error(`Couldn't prepare upload: ${err instanceof Error ? err.message : 'network error'}`)
        }

        // Step 2: send the file directly to Cloudinary via XHR (more reliable on mobile than fetch)
        const fd = new FormData()
        fd.append('file',      entries[i].file)
        fd.append('api_key',   sigData.apiKey)
        fd.append('timestamp', String(sigData.timestamp))
        fd.append('signature', sigData.signature)
        fd.append('folder',    sigData.folder)
        fd.append('context',   sigData.context)

        await xhrUpload(
          `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
          fd,
          pct => patchEntry(i, { progress: pct }),
        )

        patchEntry(i, { status: 'done', progress: 100 })
      } catch (err) {
        patchEntry(i, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' })
      }
    }

    setAllDone(true)
  }

  const pendingCount   = entries.filter(e => e.status === 'pending' || e.status === 'error').length
  const uploadingCount = entries.filter(e => e.status === 'uploading').length
  const doneCount      = entries.filter(e => e.status === 'done').length
  const isUploading    = uploadingCount > 0
  const canUpload      = name.trim().length > 0 && pendingCount > 0 && !isUploading

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      : 'Reading date…'

  return (
    <div className="cu-wrap">
      <h2 className="cu-title">Share your photos</h2>
      <p className="cu-sub">Upload your shots from the weekend — they&apos;ll be sorted by day and time automatically.</p>

      {/* Name */}
      <div className="cu-field">
        <label htmlFor="cu-name" className="cu-label">Your name</label>
        <input
          id="cu-name"
          type="text"
          className="cu-input"
          placeholder="e.g. Sarah Jones"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={80}
          autoComplete="name"
        />
      </div>

      {/* Drop zone */}
      <div
        className={`cu-dropzone ${dragging ? 'cu-dropzone--over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Click or drag photos here to add them"
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p className="cu-dz-text">Click to browse or drag photos here</p>
        <p className="cu-dz-hint">JPEG, PNG, HEIC · multiple files welcome</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {entries.length > 0 && (
        <ul className="cu-filelist">
          {entries.map((entry, i) => (
            <li key={`${entry.file.name}-${i}`} className={`cu-file cu-file--${entry.status}`}>
              <div className="cu-file-info">
                <span className="cu-file-name">{entry.file.name}</span>
                <span className="cu-file-date">{formatDate(entry.takenAt)}</span>
                {entry.error && <span className="cu-file-error">{entry.error}</span>}
                {entry.status === 'uploading' && (
                  <div className="cu-progress">
                    <div className="cu-progress-bar" style={{ width: `${entry.progress}%` }} />
                    <span className="cu-progress-label">{entry.progress}%</span>
                  </div>
                )}
              </div>
              <div className="cu-file-status">
                {entry.status === 'pending'   && <span className="cu-badge cu-badge--pending">Ready</span>}
                {entry.status === 'uploading' && <span className="cu-badge cu-badge--uploading">Uploading</span>}
                {entry.status === 'done'      && <span className="cu-badge cu-badge--done">✓ Done</span>}
                {entry.status === 'error'     && <span className="cu-badge cu-badge--error">Failed</span>}
                {entry.status !== 'uploading' && entry.status !== 'done' && (
                  <button className="cu-remove" onClick={() => removeEntry(i)} aria-label="Remove file">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      <div className="cu-actions">
        {allDone && doneCount > 0 && (
          <div className="cu-success">
            <p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              {doneCount} photo{doneCount !== 1 ? 's' : ''} uploaded — thank you!
            </p>
            <p className="cu-success-note">It takes about a minute to appear in the gallery — check back shortly.</p>
          </div>
        )}
        <button
          className="btn btn-accent cu-btn"
          onClick={uploadAll}
          disabled={!canUpload}
        >
          {isUploading
            ? `Uploading ${uploadingCount} of ${entries.length}…`
            : `Upload ${pendingCount > 0 ? `${pendingCount} photo${pendingCount !== 1 ? 's' : ''}` : 'photos'}`}
        </button>
      </div>
    </div>
  )
}

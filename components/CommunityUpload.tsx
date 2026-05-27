'use client'

import { useState, useRef, useCallback } from 'react'

interface FileEntry {
  file: File
  takenAt: string | null  // ISO string from EXIF, or null
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

async function readExifDate(file: File): Promise<string | null> {
  try {
    const exifr = await import('exifr')
    const result = await exifr.parse(file, ['DateTimeOriginal', 'DateTime', 'CreateDate'])
    const dt: Date | undefined = result?.DateTimeOriginal ?? result?.CreateDate ?? result?.DateTime
    return dt ? dt.toISOString() : null
  } catch {
    return null
  }
}

export function CommunityUpload() {
  const [name,    setName]    = useState('')
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const [allDone, setAllDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return

    const newEntries: FileEntry[] = arr.map(f => ({ file: f, takenAt: null, status: 'pending' }))
    setEntries(prev => [...prev, ...newEntries])
    setAllDone(false)

    // Read EXIF in parallel
    const dates = await Promise.all(arr.map(readExifDate))
    setEntries(prev => {
      const next = [...prev]
      // Update the entries we just added (they're at the end)
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

      setEntries(prev => prev.map((e, j) => j === i ? { ...e, status: 'uploading' } : e))

      try {
        // Get a fresh signature for this file (each can have different EXIF date)
        const sigRes = await fetch('/api/sign-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploaderName: name.trim(), photoTakenAt: entries[i].takenAt ?? '' }),
        })
        if (!sigRes.ok) throw new Error('Could not sign upload')
        const { timestamp, signature, apiKey, cloudName, folder, context } = await sigRes.json()

        const fd = new FormData()
        fd.append('file', entries[i].file)
        fd.append('api_key',   apiKey)
        fd.append('timestamp', String(timestamp))
        fd.append('signature', signature)
        fd.append('folder',    folder)
        fd.append('context',   context)

        const upRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: 'POST', body: fd }
        )
        if (!upRes.ok) {
          const err = await upRes.json().catch(() => ({}))
          throw new Error(err?.error?.message ?? 'Upload failed')
        }

        setEntries(prev => prev.map((e, j) => j === i ? { ...e, status: 'done' } : e))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setEntries(prev => prev.map((e, j) => j === i ? { ...e, status: 'error', error: msg } : e))
      }
    }

    setAllDone(true)
  }

  const pendingCount   = entries.filter(e => e.status === 'pending' || e.status === 'error').length
  const uploadingCount = entries.filter(e => e.status === 'uploading').length
  const doneCount      = entries.filter(e => e.status === 'done').length
  const isUploading    = uploadingCount > 0
  const canUpload      = name.trim().length > 0 && pendingCount > 0 && !isUploading

  const formatDate = (iso: string | null) => {
    if (!iso) return 'No date found — will sort by upload time'
    const d = new Date(iso)
    return d.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  }

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
        <p className="cu-dz-hint">JPEG, PNG, HEIC — multiple files welcome</p>
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
          {entries.map((e, i) => (
            <li key={`${e.file.name}-${i}`} className={`cu-file cu-file--${e.status}`}>
              <div className="cu-file-info">
                <span className="cu-file-name">{e.file.name}</span>
                <span className="cu-file-date">{formatDate(e.takenAt)}</span>
                {e.error && <span className="cu-file-error">{e.error}</span>}
              </div>
              <div className="cu-file-status">
                {e.status === 'pending'   && <span className="cu-badge cu-badge--pending">Ready</span>}
                {e.status === 'uploading' && <span className="cu-badge cu-badge--uploading">Uploading…</span>}
                {e.status === 'done'      && <span className="cu-badge cu-badge--done">✓ Done</span>}
                {e.status === 'error'     && <span className="cu-badge cu-badge--error">Failed</span>}
                {e.status !== 'uploading' && e.status !== 'done' && (
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
          <p className="cu-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            {doneCount} photo{doneCount !== 1 ? 's' : ''} uploaded — thank you!
          </p>
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

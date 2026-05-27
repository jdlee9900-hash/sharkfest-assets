'use client'

const ITEMS = [
  'SharkFest 2028', 'Torbay Sharks RFC', 'Devon Coast',
  '26 – 29 May 2028', 'Three Days', 'Two Stages', 'One Pack',
  'SharkFest 2028', 'Torbay Sharks RFC', 'Devon Coast',
  '26 – 29 May 2028', 'Three Days', 'Two Stages', 'One Pack',
]

const SEP = (
  <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="3" cy="3" r="3" fill="currentColor" opacity="0.4"/>
  </svg>
)

export function Marquee() {
  return (
    <div className="marquee-track" aria-hidden="true">
      <div className="marquee-inner">
        {[0, 1].map(copy => (
          <div key={copy} className="marquee-list">
            {ITEMS.map((item, i) => (
              <span key={i} className="marquee-item">
                {SEP}
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

const ITEMS = [
  '🎸 The Shrine · Live in the Marquee',
  '🏉 Super Saturday Rugby',
  '🦈 The Shark Fin Parade',
  '🍖 Hog Roast from the Pig Apple',
  '🕺 FLAIRZ · 70s Tribute Night',
  '🎧 DJ Harvs · Silent Disco',
  '🧘 Yoga with Becky B',
  '🌺 Hawaiian Night · Beat Break Bandits',
  '🪄 Kids Magician Show & Balloon Shaping',
  '🍰 Cream Tea & Pimm\'s',
  '🎤 Rachael Sweeting · Acoustic Set',
  '💃 Emerald Cheerleaders',
  '🏃 Festival Run Club · Devon Coast',
  '🎨 Kids Art Club',
  '🏉 Torbay Sharks Ladies v Bideford Ladies',
  '🎠 Kids Disco Fancy Dress',
  '🏉 Torbay Sharks Vets v Barnstaple Vets',
]

const SEP = (
  <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="3" cy="3" r="3" fill="currentColor" opacity="0.4"/>
  </svg>
)

export function Marquee({ items = ITEMS }: { items?: string[] }) {
  return (
    <div className="marquee-track" aria-hidden="true">
      <div className="marquee-inner">
        {[0, 1].map(copy => (
          <div key={copy} className="marquee-list">
            {items.map((item, i) => (
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

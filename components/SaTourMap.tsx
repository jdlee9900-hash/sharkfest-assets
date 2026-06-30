// Stylised, illustrated map of the KwaZulu-Natal tour route. Decorative —
// not to scale — built to help visitors picture the shape of the trip:
// fly into Durban, up the coast through three centres, then back to Durban.

const STOPS = [
  {
    n: '1',
    x: 252,
    y: 424,
    color: 'var(--tour-a1)',
    name: 'UMHLANGA ROCKS',
    nights: 'Nights 1–3 · the arrival',
  },
  {
    n: '2',
    x: 474,
    y: 150,
    color: 'var(--tour-a2)',
    name: 'HLUHLUWE',
    nights: 'Nights 4–6 · the bush',
  },
  {
    n: '3',
    x: 344,
    y: 356,
    color: 'var(--tour-a3)',
    name: 'ZINKWAZI BEACH',
    nights: 'Nights 7–10 · the chill-down',
  },
]

// The travelling loop: Durban → 1 → 2 → 3 → Durban.
const ROUTE = 'M178,482 L252,424 L474,150 L344,356 Z'

export function SaTourMap() {
  return (
    <svg
      className="sa-map-svg"
      viewBox="0 0 760 560"
      role="img"
      aria-label="Tour route map: fly into Durban, then up the KwaZulu-Natal coast — Umhlanga Rocks, north to Hluhluwe in Zululand, back down to Zinkwazi Beach, and home from Durban."
    >
      <defs>
        <linearGradient id="sa-ocean" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0e2a3a" />
          <stop offset="55%" stopColor="#13455a" />
          <stop offset="100%" stopColor="#1d6076" />
        </linearGradient>
        <linearGradient id="sa-land" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3ecdd" />
          <stop offset="100%" stopColor="#e7dcc4" />
        </linearGradient>
        <filter id="sa-pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* Ocean */}
      <rect x="0" y="0" width="760" height="560" fill="url(#sa-ocean)" />

      {/* Subtle ocean swell lines */}
      <g stroke="#ffffff" strokeOpacity="0.10" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M520,470 q18,-12 36,0 t36,0 t36,0" />
        <path d="M560,510 q18,-12 36,0 t36,0 t36,0" />
        <path d="M610,250 q18,-12 36,0 t36,0" />
      </g>

      {/* Land */}
      <path
        d="M0,0 L644,0
           C604,118 566,158 504,238
           C446,316 386,358 304,420
           C232,470 160,512 92,560
           L0,560 Z"
        fill="url(#sa-land)"
      />

      {/* Ocean label */}
      <text className="sa-map-ocean" x="612" y="402" transform="rotate(-37 612 402)" textAnchor="middle">
        INDIAN OCEAN
      </text>

      {/* Decorative acacia tree near the bush */}
      <g className="sa-map-tree" transform="translate(540,118)">
        <path d="M0,18 L0,4" stroke="#6b7d4e" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M-22,4 Q0,-6 22,4 Q0,0 -22,4 Z" fill="#6b7d4e" fillOpacity="0.85" />
      </g>

      {/* Route — base + animated dashes */}
      <path id="sa-route" d={ROUTE} fill="none" stroke="#fbbf24" strokeOpacity="0.28" strokeWidth="4" strokeLinejoin="round" />
      <path className="sa-map-dash" d={ROUTE} fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="2 12" />

      {/* Travelling marker */}
      <circle r="5" fill="#fff" stroke="#fbbf24" strokeWidth="2.5">
        <animateMotion dur="14s" repeatCount="indefinite" rotate="auto" path={ROUTE} />
      </circle>

      {/* Durban — fly in & out */}
      <g filter="url(#sa-pin-shadow)">
        <circle cx="178" cy="482" r="19" fill="#0f172a" />
        <circle cx="178" cy="482" r="19" fill="none" stroke="#fbbf24" strokeWidth="2" />
        <path
          d="M171,482 l13,-4 -3,4 3,4 z"
          fill="#fbbf24"
          transform="rotate(-20 178 482)"
        />
      </g>
      <text className="sa-map-name" x="178" y="520" textAnchor="middle">DURBAN</text>
      <text className="sa-map-sub" x="178" y="536" textAnchor="middle">Fly in &amp; out · DUR</text>

      {/* Numbered stops */}
      {STOPS.map((s) => (
        <g key={s.n}>
          <g filter="url(#sa-pin-shadow)">
            <circle cx={s.x} cy={s.y} r="17" fill={s.color} />
            <circle cx={s.x} cy={s.y} r="17" fill="none" stroke="#fff" strokeWidth="2.5" />
          </g>
          <text className="sa-map-num" x={s.x} y={s.y + 6} textAnchor="middle">{s.n}</text>
          <text className="sa-map-name" x={s.x - 24} y={s.y - 2} textAnchor="end">{s.name}</text>
          <text className="sa-map-sub" x={s.x - 24} y={s.y + 14} textAnchor="end">{s.nights}</text>
        </g>
      ))}

      {/* Compass */}
      <g className="sa-map-compass" transform="translate(694,70)">
        <circle r="22" fill="rgba(15,23,42,0.35)" stroke="#fbbf24" strokeWidth="1.5" />
        <path d="M0,-15 L5,2 L0,-2 L-5,2 Z" fill="#fbbf24" />
        <path d="M0,15 L5,-2 L0,2 L-5,-2 Z" fill="#ffffff" fillOpacity="0.55" />
        <text x="0" y="-26" textAnchor="middle" className="sa-map-n">N</text>
      </g>
    </svg>
  )
}

import type { BuddyId, FriendId } from '../data/content'
import { WEARABLES } from '../data/content'

type Props = { size?: number | string; talking?: boolean; className?: string }

function Frame({ size = 180, talking, className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={typeof size === 'number' ? size * 1.1 : size}
      className={`character ${talking ? 'talking' : ''} ${className ?? ''}`}
      aria-hidden
    >
      <ellipse cx="100" cy="210" rx="60" ry="8" fill="rgba(0,0,0,.15)" />
      <g className="bob">{children}</g>
    </svg>
  )
}

function Eyes({ y = 90, dx = 22, cx = 100, r = 9 }) {
  return (
    <g className="blink">
      {[cx - dx, cx + dx].map((x) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r} fill="#2b1b12" />
          <circle cx={x + r * 0.35} cy={y - r * 0.4} r={r * 0.35} fill="#fff" />
        </g>
      ))}
    </g>
  )
}

function Mouth({ y = 118, cx = 100, w = 14, color = '#7a2e2e' }) {
  return (
    <g>
      <path className="mouth-closed" d={`M${cx - w} ${y} Q${cx} ${y + w * 0.9} ${cx + w} ${y}`} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse className="mouth-open" cx={cx} cy={y + 4} rx={w * 0.6} ry={w * 0.55} fill={color} />
    </g>
  )
}

// ---------- Buddies ----------

export function Rocco(p: Props) {
  return (
    <Frame {...p}>
      {/* body with rescue vest */}
      <ellipse cx="100" cy="170" rx="52" ry="40" fill="#fff7ee" />
      <path d="M55 160 Q100 130 145 160 L140 195 Q100 210 60 195 Z" fill="#e63946" />
      <circle cx="100" cy="172" r="12" fill="#fff" />
      <path d="M100 164 v16 M92 172 h16" stroke="#e63946" strokeWidth="5" />
      {/* paws */}
      <ellipse cx="72" cy="203" rx="16" ry="9" fill="#fff7ee" />
      <ellipse cx="128" cy="203" rx="16" ry="9" fill="#fff7ee" />
      {/* head */}
      <ellipse cx="100" cy="92" rx="62" ry="56" fill="#fff7ee" />
      <path d="M58 70 Q70 40 100 38 Q90 70 72 92 Z" fill="#b5651d" />
      <path d="M142 70 Q130 40 100 38 Q110 70 128 92 Z" fill="#b5651d" />
      {/* ears */}
      <path d="M44 62 Q20 90 34 130 Q52 120 56 80 Z" fill="#8a4a14" />
      <path d="M156 62 Q180 90 166 130 Q148 120 144 80 Z" fill="#8a4a14" />
      <Eyes y={86} dx={24} />
      <ellipse cx="100" cy="108" rx="13" ry="9" fill="#2b1b12" />
      <Mouth y={122} />
      <ellipse cx="62" cy="110" rx="9" ry="5" fill="#ffb4a2" opacity=".7" />
      <ellipse cx="138" cy="110" rx="9" ry="5" fill="#ffb4a2" opacity=".7" />
      {/* collar + little barrel */}
      <rect x="62" y="138" width="76" height="10" rx="5" fill="#1d3557" />
      <rect x="90" y="146" width="20" height="14" rx="4" fill="#c68b59" stroke="#7a4b23" strokeWidth="2" />
    </Frame>
  )
}

export function Givrine(p: Props) {
  return (
    <Frame {...p}>
      {/* cape of snowflakes */}
      <path d="M50 130 Q30 190 40 205 L160 205 Q170 190 150 130 Z" fill="#cfe9ff" opacity=".9" />
      {/* dress */}
      <path d="M70 135 Q100 125 130 135 L158 205 Q100 215 42 205 Z" fill="url(#givDress)" />
      <defs>
        <linearGradient id="givDress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8a2ff" />
          <stop offset="1" stopColor="#7fd3ff" />
        </linearGradient>
      </defs>
      {[60, 90, 120, 140, 75, 110].map((x, i) => (
        <text key={i} x={x} y={165 + (i % 3) * 14} fontSize="12" fill="#fff">✦</text>
      ))}
      {/* hair back (rosy buns) */}
      <circle cx="52" cy="58" r="22" fill="#f07ab8" />
      <circle cx="148" cy="58" r="22" fill="#f07ab8" />
      <ellipse cx="100" cy="88" rx="56" ry="54" fill="#f07ab8" />
      {/* face */}
      <ellipse cx="100" cy="96" rx="44" ry="44" fill="#ffe0c8" />
      <path d="M58 78 Q100 40 142 78 Q120 62 100 70 Q80 62 58 78 Z" fill="#f07ab8" />
      {/* ice tiara */}
      <path d="M72 50 L80 30 L88 48 L100 22 L112 48 L120 30 L128 50 Z" fill="#a8e6ff" stroke="#fff" strokeWidth="2" />
      <circle cx="100" cy="34" r="4" fill="#fff" />
      <Eyes y={96} dx={17} r={7.5} />
      <Mouth y={120} w={11} color="#d6336c" />
      <ellipse cx="70" cy="112" rx="8" ry="5" fill="#ff9ec4" opacity=".7" />
      <ellipse cx="130" cy="112" rx="8" ry="5" fill="#ff9ec4" opacity=".7" />
      {/* magic sparkle */}
      <text className="sparkle" x="155" y="150" fontSize="22">❄️</text>
    </Frame>
  )
}

// ---------- Local friends ----------

export function Pepette(p: Props) {
  return (
    <Frame {...p}>
      <ellipse cx="100" cy="150" rx="58" ry="58" fill="#a0703f" />
      <ellipse cx="100" cy="165" rx="38" ry="40" fill="#e2c39b" />
      <ellipse cx="100" cy="88" rx="52" ry="46" fill="#a0703f" />
      <circle cx="56" cy="56" r="13" fill="#7d5330" />
      <circle cx="144" cy="56" r="13" fill="#7d5330" />
      <ellipse cx="100" cy="108" rx="28" ry="20" fill="#e2c39b" />
      <Eyes y={84} dx={22} r={8} />
      <ellipse cx="100" cy="100" rx="9" ry="6" fill="#2b1b12" />
      <rect x="92" y="112" width="7" height="10" rx="2" fill="#fff" />
      <rect x="101" y="112" width="7" height="10" rx="2" fill="#fff" />
      <ellipse className="mouth-open" cx="100" cy="126" rx="6" ry="4" fill="#7a2e2e" />
      <ellipse cx="62" cy="186" rx="14" ry="9" fill="#7d5330" />
      <ellipse cx="138" cy="186" rx="14" ry="9" fill="#7d5330" />
      {/* knitted scarf */}
      <path d="M58 128 Q100 145 142 128 L140 140 Q100 158 60 140 Z" fill="#e63946" />
    </Frame>
  )
}

export function Gaspard(p: Props) {
  return (
    <Frame {...p}>
      <ellipse cx="100" cy="165" rx="45" ry="40" fill="#c08a52" />
      <rect x="70" y="180" width="12" height="28" rx="5" fill="#5a3a1c" />
      <rect x="118" y="180" width="12" height="28" rx="5" fill="#5a3a1c" />
      {/* horns */}
      <path d="M78 46 Q70 10 90 14 Q80 24 86 46" fill="#2b1b12" />
      <path d="M122 46 Q130 10 110 14 Q120 24 114 46" fill="#2b1b12" />
      <ellipse cx="100" cy="90" rx="44" ry="52" fill="#d9a066" />
      <ellipse cx="56" cy="70" rx="18" ry="9" fill="#c08a52" transform="rotate(-25 56 70)" />
      <ellipse cx="144" cy="70" rx="18" ry="9" fill="#c08a52" transform="rotate(25 144 70)" />
      {/* face stripes typical of the chamois */}
      <path d="M80 60 Q86 100 92 130" stroke="#3b2516" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M120 60 Q114 100 108 130" stroke="#3b2516" strokeWidth="9" fill="none" strokeLinecap="round" />
      <Eyes y={88} dx={22} r={7} />
      <ellipse cx="100" cy="128" rx="16" ry="11" fill="#f1d3ae" />
      <Mouth y={130} w={8} />
    </Frame>
  )
}

export function Cigalou(p: Props) {
  return (
    <Frame {...p}>
      {/* wings */}
      <path className="wing" d="M100 110 Q30 90 30 170 Q70 175 100 130 Z" fill="#bde0fe" opacity=".85" stroke="#7aa6c9" strokeWidth="2" />
      <path className="wing" d="M100 110 Q170 90 170 170 Q130 175 100 130 Z" fill="#bde0fe" opacity=".85" stroke="#7aa6c9" strokeWidth="2" />
      <ellipse cx="100" cy="150" rx="30" ry="50" fill="#6b8e23" />
      {[130, 148, 166, 184].map((y) => (
        <path key={y} d={`M74 ${y} Q100 ${y + 6} 126 ${y}`} stroke="#4b6619" strokeWidth="3" fill="none" />
      ))}
      <ellipse cx="100" cy="84" rx="48" ry="40" fill="#7aa33a" />
      <circle cx="62" cy="76" r="20" fill="#fff" />
      <circle cx="138" cy="76" r="20" fill="#fff" />
      <Eyes y={78} dx={38} r={11} />
      <Mouth y={104} w={12} />
      {/* straw hat */}
      <ellipse cx="100" cy="48" rx="56" ry="10" fill="#f4d35e" />
      <path d="M72 48 Q74 22 100 20 Q126 22 128 48 Z" fill="#f4d35e" />
      <rect x="73" y="38" width="54" height="7" fill="#9b6bd3" />
    </Frame>
  )
}

export function Gaby(p: Props) {
  return (
    <Frame {...p}>
      <ellipse cx="100" cy="150" rx="50" ry="52" fill="#fff" />
      <path className="wing" d="M52 130 Q10 150 30 185 Q60 180 70 150 Z" fill="#b0bec5" />
      <path className="wing" d="M148 130 Q190 150 170 185 Q140 180 130 150 Z" fill="#b0bec5" />
      <circle cx="100" cy="88" r="46" fill="#fff" />
      <Eyes y={82} dx={18} r={7} />
      <path d="M86 98 L130 108 L86 116 Z" fill="#ffb703" />
      <path className="mouth-open" d="M88 108 L122 108 L88 113 Z" fill="#c1121f" />
      <path d="M84 196 l-8 12 M96 198 l0 12 M116 196 l8 12" stroke="#ffb703" strokeWidth="5" strokeLinecap="round" />
      {/* sailor cap */}
      <path d="M62 52 Q100 22 138 52 Z" fill="#fff" stroke="#2f80ed" strokeWidth="3" />
      <rect x="62" y="50" width="76" height="9" rx="3" fill="#2f80ed" />
      {/* striped neckerchief */}
      <path d="M70 128 L130 128 L100 150 Z" fill="#2f80ed" />
    </Frame>
  )
}

export function Korri(p: Props) {
  return (
    <Frame {...p}>
      {/* marinière */}
      <rect x="58" y="130" width="84" height="66" rx="20" fill="#fff" />
      {[140, 154, 168, 182].map((y) => (
        <rect key={y} x="58" y={y} width="84" height="6" fill="#1f3a5f" />
      ))}
      <ellipse cx="78" cy="204" rx="16" ry="8" fill="#5a3a1c" />
      <ellipse cx="122" cy="204" rx="16" ry="8" fill="#5a3a1c" />
      {/* big ears */}
      <ellipse cx="46" cy="96" rx="18" ry="12" fill="#e8b896" transform="rotate(-20 46 96)" />
      <ellipse cx="154" cy="96" rx="18" ry="12" fill="#e8b896" transform="rotate(20 154 96)" />
      <circle cx="100" cy="96" r="44" fill="#f0c8a8" />
      {/* beard */}
      <path d="M62 104 Q100 168 138 104 Q120 126 100 124 Q80 126 62 104 Z" fill="#e9ecef" />
      <Eyes y={88} dx={18} r={7} />
      <ellipse cx="100" cy="104" rx="9" ry="7" fill="#e5989b" />
      <Mouth y={116} w={9} />
      {/* pointy red hat */}
      <path d="M54 72 Q100 -10 160 20 Q130 34 146 72 Z" fill="#c1121f" />
      <circle cx="160" cy="20" r="8" fill="#fff" />
      <rect x="52" y="64" width="96" height="12" rx="6" fill="#2b2d42" />
    </Frame>
  )
}

const FRIEND_COMPONENTS: Record<FriendId, (p: Props) => React.ReactElement> = {
  pepette: Pepette,
  gaspard: Gaspard,
  cigalou: Cigalou,
  gaby: Gaby,
  korri: Korri,
}

export function Friend({ id, ...p }: Props & { id: FriendId }) {
  const C = FRIEND_COMPONENTS[id]
  return <C {...p} />
}

/** The child's buddy, wearing the items they picked in the atelier. */
export function Buddy({ id, outfit, ...p }: Props & { id: BuddyId; outfit?: Record<string, string | undefined> }) {
  const C = id === 'rocco' ? Rocco : Givrine
  const size = typeof p.size === 'number' ? p.size : 180
  const pos: Record<string, { top: string; left: string; fs: number }> = {
    head: { top: '-4%', left: '50%', fs: 0.32 },
    face: { top: '30%', left: '50%', fs: 0.3 },
    neck: { top: '58%', left: '50%', fs: 0.24 },
    hand: { top: '70%', left: '86%', fs: 0.26 },
  }
  return (
    <div className="buddy-wrap" style={{ width: size, height: size * 1.1 }}>
      <C {...p} />
      {outfit &&
        Object.entries(outfit).map(([slot, wid]) => {
          const w = WEARABLES.find((x) => x.id === wid)
          if (!w) return null
          const s = pos[slot]
          return (
            <span key={slot} className="wearable" style={{ top: s.top, left: s.left, fontSize: size * s.fs }}>
              {w.emoji}
            </span>
          )
        })}
    </div>
  )
}

export function MonsterTruck({ size = 160, color = '#e63946' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 220 150" width={size} height={size * 0.68} aria-hidden className="truck">
      <rect x="30" y="40" width="160" height="50" rx="14" fill={color} />
      <path d="M70 40 L90 10 L150 10 L170 40 Z" fill={color} />
      <path d="M96 16 L144 16 L158 38 L86 38 Z" fill="#bde0fe" />
      <path d="M40 60 h40 M140 60 h40" stroke="#ffd166" strokeWidth="6" strokeLinecap="round" />
      <text x="110" y="78" textAnchor="middle" fontSize="20" fill="#fff" fontWeight="bold">R</text>
      {[60, 160].map((x) => (
        <g key={x} className="wheel" style={{ transformOrigin: `${x}px 112px` }}>
          <circle cx={x} cy="112" r="34" fill="#222" />
          <circle cx={x} cy="112" r="15" fill="#888" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect key={a} x={x - 4} y="78" width="8" height="10" fill="#444" transform={`rotate(${a} ${x} 112)`} />
          ))}
        </g>
      ))}
    </svg>
  )
}

/** A picture for an activity or sticker: an emoji, or "svg:name" for custom drawings. */
export function Pic({ v }: { v: string }) {
  if (!v.startsWith('svg:')) return <>{v}</>
  switch (v.slice(4)) {
    case 'marmotte':
      return <Pepette size="1em" className="pic" />
    case 'phare':
      return (
        <svg viewBox="0 0 100 100" width="1em" height="1em" className="pic" aria-hidden>
          <path d="M30 96 L38 30 L62 30 L70 96 Z" fill="#fff" stroke="#333" strokeWidth="3" />
          <path d="M35.5 50 L64.5 50 L66.5 64 L33.5 64 Z M32.5 76 L67.5 76 L69 88 L31 88 Z" fill="#d62828" />
          <rect x="34" y="16" width="32" height="14" rx="3" fill="#ffd166" stroke="#333" strokeWidth="3" />
          <path d="M30 16 L50 2 L70 16 Z" fill="#d62828" stroke="#333" strokeWidth="3" />
          <path d="M66 22 L100 12 L100 34 Z M34 22 L0 12 L0 34 Z" fill="#ffe066" opacity=".7" />
          <path d="M10 96 Q50 88 90 96" stroke="#2a6f97" strokeWidth="5" fill="none" />
        </svg>
      )
    case 'gwennhadu':
      return (
        <svg viewBox="0 0 100 70" width="1em" height="1em" className="pic" aria-hidden>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <rect key={i} x="0" y={i * 7.7} width="100" height="7.8" fill={i % 2 ? '#fff' : '#111'} />
          ))}
          <rect x="0" y="0" width="42" height="38.5" fill="#fff" />
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <path key={`${r}${c}`} d={`M${7 + c * 13} ${6 + r * 12} l3 6 l-3 3 l-3 -3 Z`} fill="#111" />))}
          <rect x="0" y="0" width="100" height="70" fill="none" stroke="#999" strokeWidth="2" />
        </svg>
      )
    default:
      return <>❓</>
  }
}

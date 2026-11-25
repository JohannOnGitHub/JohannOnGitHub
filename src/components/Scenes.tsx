import type { PlaceId } from '../data/content'

const W = 1600
const H = 900

function Svg({ children, sky }: { children: React.ReactNode; sky: [string, string] }) {
  const id = `sky-${sky.join('').replace(/#/g, '')}`
  return (
    <svg className="scene" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
      {children}
    </svg>
  )
}

function Cloud({ x, y, s = 1, o = 0.95 }: { x: number; y: number; s?: number; o?: number }) {
  return (
    <g className="cloud" transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <ellipse cx="0" cy="0" rx="70" ry="34" fill="#fff" />
      <ellipse cx="55" cy="-18" rx="50" ry="36" fill="#fff" />
      <ellipse cx="110" cy="2" rx="60" ry="30" fill="#fff" />
    </g>
  )
}

function Pine({ x, y, s = 1, snow = false }: { x: number; y: number; s?: number; snow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-6" y="0" width="12" height="24" fill="#6b4226" />
      <path d="M0 -110 L-40 -40 L-22 -40 L-50 10 L50 10 L22 -40 L40 -40 Z" fill="#2d6a4f" />
      {snow && <path d="M0 -110 L-18 -78 Q0 -70 18 -78 Z M-30 -40 L-22 -40 L-10 -50 L10 -50 L22 -40 L30 -40 Q0 -30 -30 -40Z" fill="#fff" />}
    </g>
  )
}

function Sun({ x, y, r = 70 }: { x: number; y: number; r?: number }) {
  return (
    <g className="sun">
      <circle cx={x} cy={y} r={r * 1.6} fill="#fff6bf" opacity=".35" />
      <circle cx={x} cy={y} r={r} fill="#ffd23f" />
    </g>
  )
}

function Mountain({ d, fill, snow }: { d: string; fill: string; snow?: string }) {
  return (
    <g>
      <path d={d} fill={fill} />
      {snow && <path d={snow} fill="#fff" />}
    </g>
  )
}

function Alpe() {
  return (
    <Svg sky={['#7cc6ff', '#dff3ff']}>
      <Sun x={1350} y={150} />
      <Cloud x={200} y={140} />
      <Cloud x={820} y={100} s={0.8} />
      <Mountain
        d="M-50 620 L220 230 L380 420 L560 160 L760 430 L900 300 L1100 520 L1300 200 L1650 600 L1650 900 L-50 900 Z"
        fill="#8fa9c4"
        snow="M220 230 L170 300 L210 290 L240 320 L270 290 Z M560 160 L500 250 L540 235 L570 265 L610 230 Z M1300 200 L1240 290 L1280 270 L1310 300 L1350 270 Z M900 300 L860 360 L895 350 L920 365 Z"
      />
      <Mountain
        d="M-50 700 L300 420 L520 600 L760 380 L1000 620 L1250 420 L1650 720 L1650 900 L-50 900 Z"
        fill="#5d7f9e"
        snow="M300 420 L250 470 L290 462 L320 480 L350 460 Z M760 380 L710 440 L752 430 L790 450 L815 432 Z M1250 420 L1200 470 L1240 462 L1270 478 L1300 460 Z"
      />
      {/* the famous hairpin road */}
      <path
        d="M560 900 L860 840 L600 800 L880 760 L620 720 L900 690 L660 660 L930 630"
        stroke="#4a4e69"
        strokeWidth="16"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M560 900 L860 840 L600 800 L880 760 L620 720 L900 690 L660 660 L930 630"
        stroke="#fff"
        strokeWidth="2"
        strokeDasharray="12 12"
        fill="none"
      />
      <path d="M-50 780 Q400 700 800 790 T1650 760 L1650 900 L-50 900 Z" fill="#f4fbff" />
      {[100, 190, 1350, 1450, 1530].map((x, i) => (
        <Pine key={x} x={x} y={800 + (i % 2) * 30} s={1 + (i % 3) * 0.15} snow />
      ))}
      {/* chalet */}
      <g transform="translate(1100 740)">
        <rect x="0" y="0" width="140" height="90" fill="#9c6644" />
        <path d="M-20 5 L70 -60 L160 5 Z" fill="#6f4518" />
        <path d="M-20 5 L70 -60 L160 5 L150 -2 L70 -48 L-10 -2 Z" fill="#fff" />
        <rect x="20" y="25" width="30" height="30" fill="#ffd166" />
        <rect x="90" y="25" width="30" height="30" fill="#ffd166" />
        <rect x="55" y="45" width="30" height="45" fill="#5a3a1c" />
      </g>
      <Snowflakes />
    </Svg>
  )
}

function Snowflakes() {
  return (
    <g className="snow">
      {Array.from({ length: 26 }).map((_, i) => (
        <circle key={i} cx={(i * 263) % 1600} cy={(i * 137) % 700} r={3 + (i % 4)} fill="#fff" opacity=".85" style={{ animationDelay: `${(i % 9) * -1.3}s` }} />
      ))}
    </g>
  )
}

function StVincent() {
  return (
    <Svg sky={['#8ed1fc', '#e9f7ff']}>
      <Sun x={1400} y={130} r={60} />
      <Cloud x={300} y={120} s={0.9} />
      <Cloud x={980} y={170} s={0.7} />
      <Mountain
        d="M-50 520 L250 250 L470 430 L700 220 L950 440 L1200 260 L1650 540 L1650 900 L-50 900 Z"
        fill="#9db4c0"
        snow="M250 250 L215 300 L250 290 L280 305 Z M700 220 L660 280 L700 268 L735 285 Z M1200 260 L1160 310 L1200 300 L1235 315 Z"
      />
      <path d="M-50 600 Q300 500 620 580 T1650 560 L1650 900 L-50 900 Z" fill="#7aa36a" />
      {/* Serre-Ponçon lake */}
      <path d="M380 700 Q700 600 1100 640 Q1500 660 1650 640 L1650 900 L380 900 Q300 800 380 700 Z" fill="#2ec4b6" />
      <path d="M460 720 Q760 640 1100 670" stroke="#9ff3e8" strokeWidth="5" fill="none" opacity=".7" />
      <path d="M560 790 Q860 720 1300 750" stroke="#9ff3e8" strokeWidth="4" fill="none" opacity=".5" />
      {/* sailboats */}
      {[
        [880, 720, 1],
        [1220, 780, 0.8],
        [1450, 700, 0.6],
      ].map(([x, y, s]) => (
        <g key={x} className="boat" transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M-50 0 L50 0 L35 22 L-35 22 Z" fill="#fff" />
          <path d="M0 -90 L0 0 L55 0 Z" fill="#ff6b6b" />
          <path d="M-4 -80 L-4 -4 L-45 -4 Z" fill="#ffd166" />
        </g>
      ))}
      {/* village perched on the hill with the fort on top */}
      <path d="M-50 900 L-50 470 Q120 390 330 520 Q420 640 470 900 Z" fill="#5f8d4e" />
      <g transform="translate(60 380)">
        <path d="M0 60 L0 20 L30 20 L30 0 L50 0 L50 20 L90 20 L90 0 L110 0 L110 20 L150 20 L150 0 L170 0 L170 20 L200 20 L200 60 Z" fill="#b8a98a" stroke="#857654" strokeWidth="3" />
        <path d="M200 60 L200 -20 L215 -20 L215 -35 L230 -35 L230 -20 L245 -20 L245 60 Z" fill="#a8977a" stroke="#857654" strokeWidth="3" />
        <path d="M222 -35 L222 -70 L260 -60 L222 -50" fill="#e63946" stroke="#555" strokeWidth="2" />
      </g>
      {[
        [80, 520],
        [170, 500],
        [250, 560],
        [130, 600],
        [220, 640],
        [310, 650],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect x="-30" y="0" width="60" height="50" fill={['#f2e3c6', '#f6d8ae', '#efe1d1'][i % 3]} />
          <path d="M-38 4 L0 -26 L38 4 Z" fill="#d9643a" />
          <rect x="-10" y="18" width="14" height="16" fill="#3d5a80" />
        </g>
      ))}
      <Pine x={420} y={820} s={1.2} />
      <Pine x={340} y={860} s={0.9} />
    </Svg>
  )
}

function Provence() {
  return (
    <Svg sky={['#ffb36b', '#ffe8c2']}>
      <Sun x={1250} y={190} r={90} />
      <path d="M-50 520 Q300 420 700 500 T1650 470 L1650 900 L-50 900 Z" fill="#c7b37a" />
      <path d="M-50 560 Q400 500 800 560 T1650 540 L1650 900 L-50 900 Z" fill="#b2a167" />
      {/* lavender rows converging to the horizon */}
      <path d="M-50 600 L1650 600 L1650 900 L-50 900 Z" fill="#7a9e4e" />
      {Array.from({ length: 14 }).map((_, i) => {
        const x0 = -200 + i * 150
        const xt = 600 + i * 30
        return <path key={i} d={`M${xt} 600 L${xt + 14} 600 L${x0 + 110} 900 L${x0} 900 Z`} fill={i % 2 ? '#8e6cc9' : '#a685e2'} />
      })}
      {/* mas (stone farmhouse) */}
      <g transform="translate(1180 470)">
        <rect x="0" y="0" width="220" height="110" fill="#f0dcb4" />
        <path d="M-15 6 L110 -40 L235 6 Z" fill="#d9643a" />
        {[30, 100, 170].map((x) => (
          <rect key={x} x={x} y="30" width="26" height="34" fill="#5d8aa8" stroke="#3b6382" strokeWidth="3" />
        ))}
        <rect x="95" y="70" width="34" height="40" fill="#5d8aa8" />
      </g>
      {/* cypresses */}
      {[1120, 1440, 1500].map((x, i) => (
        <ellipse key={x} cx={x} cy={500 - i * 6} rx="20" ry={90 + i * 8} fill="#2d5016" />
      ))}
      {/* olive trees */}
      {[180, 420].map((x) => (
        <g key={x} transform={`translate(${x} 560)`}>
          <path d="M-8 0 Q-14 40 -4 70 L8 70 Q16 40 8 0 Z" fill="#6b4f32" />
          <ellipse cx="0" cy="-20" rx="80" ry="45" fill="#8aa37b" />
          <ellipse cx="-40" cy="-40" rx="45" ry="30" fill="#9cb58c" />
          <ellipse cx="40" cy="-35" rx="45" ry="30" fill="#7d966d" />
        </g>
      ))}
      <g className="bees">
        {[300, 700, 1000].map((x, i) => (
          <text key={x} x={x} y={640 + i * 40} fontSize="34" style={{ animationDelay: `${i * -1.2}s` }}>🐝</text>
        ))}
      </g>
    </Svg>
  )
}

function Marseille() {
  return (
    <Svg sky={['#5ab1ff', '#d5eeff']}>
      <Sun x={1400} y={140} r={70} />
      <Cloud x={1000} y={120} s={0.8} />
      <g transform="translate(1600 0) scale(-1 1)">
      {/* white limestone calanques */}
      <path d="M1100 900 L1150 560 L1260 470 L1380 520 L1500 430 L1650 480 L1650 900 Z" fill="#ece4d4" />
      <path d="M1150 560 L1260 470 L1300 600 L1220 700 Z" fill="#d9cfba" />
      </g>
      <g transform="translate(330 0)">
      {/* hill with Notre-Dame de la Garde */}
      <path d="M200 650 Q420 330 720 360 Q960 380 1100 650 Z" fill="#b8a07a" />
      <path d="M260 650 Q460 420 720 420 Q900 430 1040 650 Z" fill="#9c8662" />
      <g transform="translate(610 210)">
        <rect x="0" y="80" width="200" height="90" fill="#f3e9d8" stroke="#bfae8e" strokeWidth="3" />
        {[0, 40, 80, 120, 160].map((x) => (
          <rect key={x} x={x + 8} y="80" width="24" height="90" fill={x % 80 === 0 ? '#e5d6bd' : '#f3e9d8'} />
        ))}
        <path d="M60 80 Q100 30 140 80 Z" fill="#e5d6bd" stroke="#bfae8e" strokeWidth="3" />
        <rect x="80" y="-40" width="40" height="125" fill="#f3e9d8" stroke="#bfae8e" strokeWidth="3" />
        <rect x="80" y="-40" width="40" height="18" fill="#c9b18a" />
        <rect x="92" y="-80" width="16" height="40" fill="#e0c068" />
        <circle cx="100" cy="-90" r="12" fill="#f4c430" />
        <circle cx="100" cy="-90" r="24" fill="#ffe066" opacity=".35" className="glow" />
      </g>
      </g>
      {/* the sea */}
      <path d="M-50 640 L1650 640 L1650 900 L-50 900 Z" fill="#1d6fd8" />
      <g className="waves">
        {[680, 740, 810].map((y, i) => (
          <path key={y} d={`M-100 ${y} q50 -18 100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0`} stroke="#7cc0ff" strokeWidth="4" fill="none" opacity={0.7 - i * 0.15} />
        ))}
      </g>
      {/* Vieux-Port boats */}
      {[
        [220, 760, '#ffd166'],
        [420, 800, '#ef476f'],
        [640, 770, '#06d6a0'],
        [880, 820, '#fff'],
      ].map(([x, y, c]) => (
        <g key={String(x)} className="boat" transform={`translate(${x} ${y})`}>
          <path d="M-60 0 L60 0 L45 26 L-45 26 Z" fill={String(c)} stroke="#264653" strokeWidth="3" />
          <rect x="-4" y="-70" width="6" height="70" fill="#6b4226" />
          <path d="M2 -66 L44 -10 L2 -10 Z" fill="#fff" />
        </g>
      ))}
      {[[1000, 280], [1120, 230], [380, 320]].map(([x, y], i) => (
        <path key={i} className="gull" d={`M${x} ${y} q20 -18 40 0 q20 -18 40 0`} stroke="#334" strokeWidth="5" fill="none" strokeLinecap="round" />
      ))}
    </Svg>
  )
}

function Bretagne() {
  return (
    <Svg sky={['#8fb3d9', '#e3ecf5']}>
      <Cloud x={160} y={140} s={1.1} />
      <Cloud x={700} y={90} s={0.9} />
      <Cloud x={1180} y={160} s={1.2} o={0.9} />
      {/* sea and rocky coast */}
      <path d="M-50 560 L1650 560 L1650 900 L-50 900 Z" fill="#2a6f97" />
      <g className="waves">
        {[600, 660].map((y, i) => (
          <path key={y} d={`M-100 ${y} q50 -18 100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0`} stroke="#a9d6e5" strokeWidth="4" fill="none" opacity={0.7 - i * 0.2} />
        ))}
      </g>
      <path d="M1050 900 L1100 620 L1200 580 L1320 620 L1420 560 L1650 600 L1650 900 Z" fill="#6c757d" />
      <path d="M1100 620 L1200 580 L1230 680 L1150 720 Z" fill="#868e96" />
      {/* striped lighthouse */}
      <g transform="translate(1300 230)">
        <path d="M20 360 L40 60 L100 60 L120 360 Z" fill="#fff" />
        {[90, 170, 250, 330].map((y) => {
          const t = (y - 60) / 300
          const l = 40 - 20 * t
          const r = 100 + 20 * t
          return <path key={y} d={`M${l} ${y} L${r} ${y} L${r + 2.7} ${y + 40} L${l - 2.7} ${y + 40} Z`} fill="#d62828" />
        })}
        <rect x="30" y="20" width="80" height="40" rx="6" fill="#ffd166" stroke="#333" strokeWidth="4" />
        <path d="M24 20 L70 -20 L116 20 Z" fill="#d62828" />
        <path className="beam" d="M70 40 L-500 -60 L-500 140 Z" fill="#fff6bf" opacity=".35" />
      </g>
      {/* green land with half-timbered Rennes houses */}
      <path d="M-50 900 L-50 640 Q300 580 700 660 Q900 700 1000 900 Z" fill="#5b8c51" />
      {[
        [40, '#e76f51'],
        [200, '#f4a261'],
        [360, '#2a9d8f'],
        [520, '#e9c46a'],
      ].map(([x, c], i) => (
        <g key={i} transform={`translate(${x} ${470 + (i % 2) * 20}) rotate(${i % 2 ? 2 : -2})`}>
          <rect x="0" y="0" width="140" height="230" fill={String(c)} />
          <path d="M-8 4 L70 -70 L148 4 Z" fill="#4a4e69" />
          {/* timber frame */}
          <path d="M0 0 V230 M140 0 V230 M0 80 H140 M0 160 H140 M0 0 L70 80 L140 0 M0 80 L70 160 L140 80" stroke="#5a3a1c" strokeWidth="7" fill="none" />
          <rect x="20" y="100" width="30" height="40" fill="#fdf0d5" stroke="#5a3a1c" strokeWidth="4" />
          <rect x="90" y="100" width="30" height="40" fill="#fdf0d5" stroke="#5a3a1c" strokeWidth="4" />
          <rect x="52" y="180" width="36" height="50" fill="#5a3a1c" />
        </g>
      ))}
      {/* Gwenn ha Du flag */}
      <g transform="translate(720 520)">
        <rect x="0" y="0" width="6" height="170" fill="#555" />
        <g className="flag">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <rect key={i} x="6" y={i * 10} width="130" height="10" fill={i % 2 ? '#fff' : '#111'} />
          ))}
          <rect x="6" y="0" width="50" height="50" fill="#fff" />
          {[0, 1, 2].map((r) =>
            [0, 1].map((c) => <text key={`${r}${c}`} x={12 + c * 22} y={16 + r * 15} fontSize="12" fill="#111">⚜</text>),
          )}
        </g>
      </g>
    </Svg>
  )
}

export function Scene({ place }: { place: PlaceId | 'map' }) {
  switch (place) {
    case 'alpe':
      return <Alpe />
    case 'stvincent':
      return <StVincent />
    case 'provence':
      return <Provence />
    case 'marseille':
      return <Marseille />
    case 'bretagne':
      return <Bretagne />
    default:
      return <Alpe />
  }
}

/** Stylised map of France with a pin for each place. */
export const MAP_PINS: Record<PlaceId, { x: number; y: number }> = {
  bretagne: { x: 232, y: 330 },
  alpe: { x: 690, y: 565 },
  stvincent: { x: 815, y: 690 },
  provence: { x: 560, y: 690 },
  marseille: { x: 690, y: 820 },
}

export function FranceMap({ children }: { children?: React.ReactNode }) {
  return (
    <svg className="france" viewBox="0 0 1000 1000" aria-hidden>
      <defs>
        <radialGradient id="land" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#c7f0b5" />
          <stop offset="1" stopColor="#8fd17a" />
        </radialGradient>
      </defs>
      <path
        d="M500 20 L545 49 L609 108 L647 113 L711 172 L750 181 L826 221 L865 230 L826 363 L788 377 L730 461 L724 500 L775 510 L788 529 L762 608 L788 637 L788 696 L820 735 L782 764 L724 804 L686 794 L641 774 L596 764 L545 804 L535 862 L468 872 L404 843 L295 828 L225 779 L247 755 L263 657 L270 568 L263 500 L212 441 L186 402 L142 372 L65 343 L39 323 L39 274 L110 245 L167 270 L218 255 L244 260 L238 206 L218 157 L257 162 L270 186 L346 181 L353 157 L430 118 L442 39 Z"
        fill="url(#land)"
        stroke="#fff"
        strokeWidth="14"
        strokeLinejoin="round"
      />
      <path d="M942 813 L951 902 L929 970 L890 921 L897 853 Z" fill="#8fd17a" stroke="#fff" strokeWidth="8" />
      {/* Alps */}
      {[
        [800, 560],
        [760, 520],
        [835, 610],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x - 40} ${y + 30} L${x} ${y - 30} L${x + 40} ${y + 30} Z`} fill="#9aa9b8" stroke="#fff" strokeWidth="4" />
      ))}
      {children}
    </svg>
  )
}

import React from 'react';

/**
 * Flat vector illustrations in the portal's maroon / blush / beige palette.
 * They use the site's colour tokens, so they follow the theme, stay a few
 * kilobytes each, and stay sharp at any size. All are decorative (aria-hidden):
 * the surrounding text carries the meaning.
 */

const C = {
  maroon: 'hsl(var(--primary))',
  maroonBright: 'hsl(var(--primary-bright))',
  muted: 'hsl(var(--primary-muted))',
  blush: 'hsl(var(--primary-subtle))',
  rose: 'hsl(0 45% 91%)',
  roseMid: 'hsl(0 36% 80%)',
  roseDeep: 'hsl(0 32% 62%)',
  beige: 'hsl(var(--secondary))',
  ivory: 'hsl(var(--card))',
  line: 'hsl(var(--border))',
  green: 'hsl(var(--success))',
  greenSubtle: 'hsl(var(--success-subtle))',
  amber: 'hsl(var(--warning))',
  amberSubtle: 'hsl(var(--warning-subtle))',
  asphalt: 'hsl(25 8% 36%)',
  asphaltDark: 'hsl(25 8% 22%)',
  trunk: 'hsl(20 28% 30%)',
};

type Props = { className?: string };

const svgProps = (viewBox: string, className?: string) => ({
  viewBox,
  className,
  'aria-hidden': true as const,
  focusable: 'false' as const,
  xmlns: 'http://www.w3.org/2000/svg',
});

/** Map pin whose tip sits at (x, y). */
function Pin({ x, y, size = 1, fill = C.maroon }: { x: number; y: number; size?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path d="M0 0 C-8 -12 -18 -22 -18 -34 A18 18 0 1 1 18 -34 C18 -22 8 -12 0 0Z" fill={fill} />
      <circle cx="0" cy="-34" r="7" fill={C.ivory} />
    </g>
  );
}

/** Step 1 — a phone recording a spoken report. */
export function IllustrationShare({ className }: Props) {
  return (
    <svg {...svgProps('0 0 200 150', className)}>
      <ellipse cx="100" cy="80" rx="84" ry="62" fill={C.rose} />
      <path d="M58 52 q-11 14 0 28" stroke={C.maroon} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M47 43 q-18 23 0 46" stroke={C.maroon} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".5" />
      <path d="M142 52 q11 14 0 28" stroke={C.maroon} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M153 43 q18 23 0 46" stroke={C.maroon} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".5" />
      <rect x="72" y="18" width="56" height="108" rx="12" fill={C.ivory} stroke={C.maroon} strokeWidth="3.5" />
      <rect x="90" y="25" width="20" height="4" rx="2" fill={C.line} />
      <circle cx="100" cy="64" r="17" fill={C.maroon} />
      <rect x="95.5" y="53" width="9" height="15" rx="4.5" fill={C.ivory} />
      <path d="M91.5 64 a8.5 8.5 0 0 0 17 0" stroke={C.ivory} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M100 72.5 v5" stroke={C.ivory} strokeWidth="2.6" strokeLinecap="round" />
      {[84, 90, 96, 102, 108, 114].map((x, i) => {
        const h = [8, 16, 24, 14, 20, 8][i];
        return <rect key={x} x={x} y={100 - h / 2} width="4" height={h} rx="2" fill={C.muted} />;
      })}
      <rect x="82" y="113" width="36" height="4" rx="2" fill={C.line} />
      <Pin x={158} y={50} size={0.62} />
      <circle cx="34" cy="116" r="5" fill={C.beige} />
      <circle cx="170" cy="108" r="3.5" fill={C.roseMid} />
    </svg>
  );
}

/** Step 2 — a report being checked. */
export function IllustrationReview({ className }: Props) {
  return (
    <svg {...svgProps('0 0 200 150', className)}>
      <ellipse cx="100" cy="80" rx="84" ry="62" fill={C.rose} />
      <rect x="48" y="18" width="78" height="104" rx="9" fill={C.ivory} stroke={C.maroon} strokeWidth="3.5" />
      <Pin x={68} y={44} size={0.5} />
      <rect x="82" y="30" width="34" height="5" rx="2.5" fill={C.line} />
      <rect x="82" y="40" width="22" height="5" rx="2.5" fill={C.line} />
      {[62, 74, 86, 98].map((y, i) => (
        <rect key={y} x="60" y={y} width={[54, 60, 46, 56][i]} height="5" rx="2.5" fill={C.line} />
      ))}
      <circle cx="120" cy="90" r="27" fill={C.ivory} fillOpacity=".9" stroke={C.maroon} strokeWidth="5" />
      <line x1="139.5" y1="109.5" x2="162" y2="132" stroke={C.maroon} strokeWidth="9" strokeLinecap="round" />
      <circle cx="120" cy="90" r="14" fill={C.greenSubtle} />
      <path d="M113 90.5 l5.5 5.5 l10.5 -12" stroke={C.green} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="30" cy="40" r="4.5" fill={C.beige} />
      <circle cx="178" cy="44" r="3.5" fill={C.roseMid} />
    </svg>
  );
}

/** Step 3 — a letter on its way to the municipal office. */
export function IllustrationDepartment({ className }: Props) {
  return (
    <svg {...svgProps('0 0 200 150', className)}>
      <ellipse cx="104" cy="82" rx="84" ry="60" fill={C.rose} />
      <g transform="translate(16 0)">
        <rect x="38" y="120" width="116" height="8" rx="2" fill={C.maroon} />
        <rect x="46" y="112" width="100" height="8" rx="2" fill={C.maroonBright} />
        <path d="M96 24 L152 56 H40 Z" fill={C.maroon} />
        <circle cx="96" cy="44" r="6" fill={C.ivory} />
        <rect x="40" y="56" width="112" height="8" fill={C.maroonBright} />
        {[50, 74, 98, 122].map((x) => (
          <rect key={x} x={x} y="64" width="16" height="48" rx="2" fill={C.ivory} stroke={C.maroon} strokeWidth="2.5" />
        ))}
      </g>
      <path d="M44 98 q16 18 42 8" stroke={C.maroon} strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" fill="none" />
      <rect x="6" y="62" width="40" height="28" rx="5" fill={C.ivory} stroke={C.maroon} strokeWidth="3" />
      <path d="M7 66 L26 80 L45 66" stroke={C.maroon} strokeWidth="3" strokeLinejoin="round" fill="none" />
      <circle cx="180" cy="34" r="12" fill={C.green} />
      <path d="M174 34.5 l4.5 4.5 l8 -9" stroke={C.ivory} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** Step 4 — a public progress tracker. */
export function IllustrationTracker({ className }: Props) {
  const rows = [
    { y: 56, pill: C.greenSubtle, dot: C.green },
    { y: 76, pill: C.amberSubtle, dot: C.amber },
    { y: 96, pill: C.blush, dot: C.maroon },
  ];
  return (
    <svg {...svgProps('0 0 200 150', className)}>
      <ellipse cx="100" cy="80" rx="86" ry="62" fill={C.rose} />
      <rect x="26" y="20" width="148" height="110" rx="13" fill={C.ivory} stroke={C.maroon} strokeWidth="3.5" />
      <rect x="40" y="33" width="62" height="8" rx="4" fill={C.maroon} />
      <circle cx="156" cy="37" r="5.5" fill={C.beige} />
      {rows.map((row, i) => (
        <g key={row.y}>
          <circle cx="48" cy={row.y + 6} r="5.5" fill={C.roseMid} />
          <rect x="60" y={row.y + 3} width={[52, 44, 56][i]} height="6" rx="3" fill={C.line} />
          <rect x="120" y={row.y} width="42" height="12" rx="6" fill={row.pill} />
          <circle cx="129" cy={row.y + 6} r="3.4" fill={row.dot} />
          <rect x="137" y={row.y + 4} width="19" height="4" rx="2" fill={row.dot} opacity=".45" />
        </g>
      ))}
      <line x1="48" y1="118" x2="100" y2="118" stroke={C.maroon} strokeWidth="2.8" />
      <line x1="100" y1="118" x2="152" y2="118" stroke={C.line} strokeWidth="2.8" />
      <circle cx="48" cy="118" r="4.8" fill={C.maroon} />
      <circle cx="100" cy="118" r="4.8" fill={C.maroon} />
      <circle cx="152" cy="118" r="4.8" fill={C.ivory} stroke={C.maroon} strokeWidth="2.6" />
    </svg>
  );
}

/** A street in a ward — the everyday problems this helpdesk is about. */
export function IllustrationWard({ className }: Props) {
  return (
    <svg {...svgProps('0 0 480 270', className)}>
      <circle cx="392" cy="62" r="34" fill={C.beige} opacity=".55" />
      {/* distant skyline */}
      <g fill={C.roseMid} opacity=".55">
        <rect x="150" y="124" width="26" height="72" rx="2" />
        <rect x="180" y="106" width="22" height="90" rx="2" />
        <rect x="266" y="130" width="30" height="66" rx="2" />
        <rect x="426" y="112" width="32" height="84" rx="2" />
        <rect x="436" y="86" width="12" height="26" rx="2" />
      </g>
      <rect x="0" y="196" width="480" height="76" fill={C.rose} />
      {/* road */}
      <path d="M0 226 H480 V270 H0Z" fill={C.asphalt} />
      <line x1="0" y1="247" x2="480" y2="247" stroke={C.ivory} strokeWidth="3.5" strokeDasharray="16 12" />
      <ellipse cx="250" cy="250" rx="30" ry="8" fill={C.asphaltDark} />
      <ellipse cx="250" cy="248.5" rx="30" ry="8" fill="none" stroke={C.asphalt} strokeWidth="2" />
      {/* house 1 */}
      <rect x="30" y="150" width="82" height="52" fill={C.ivory} stroke={C.maroon} strokeWidth="3" />
      <path d="M24 152 L71 112 L118 152Z" fill={C.maroon} />
      <rect x="62" y="170" width="20" height="32" fill={C.beige} />
      <rect x="40" y="164" width="16" height="14" fill={C.blush} stroke={C.maroon} strokeWidth="2" />
      <rect x="88" y="164" width="16" height="14" fill={C.blush} stroke={C.maroon} strokeWidth="2" />
      {/* house 2 */}
      <rect x="132" y="166" width="60" height="36" fill={C.ivory} stroke={C.maroon} strokeWidth="3" />
      <path d="M126 168 L162 140 L198 168Z" fill={C.maroonBright} />
      <rect x="152" y="180" width="16" height="22" fill={C.beige} />
      {/* tree */}
      <rect x="226" y="152" width="9" height="50" rx="2" fill={C.trunk} />
      <circle cx="230" cy="136" r="27" fill={C.roseDeep} />
      <circle cx="210" cy="150" r="18" fill={C.muted} />
      <circle cx="250" cy="148" r="18" fill={C.muted} />
      {/* street light */}
      <polygon points="334,126 360,126 380,200 316,200" fill={C.beige} opacity=".28" />
      <rect x="318" y="112" width="6" height="90" rx="2" fill={C.maroon} />
      <path d="M321 114 q22 -10 36 4" stroke={C.maroon} strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="358" cy="121" rx="11" ry="5.5" fill={C.beige} stroke={C.maroon} strokeWidth="2" />
      {/* drain */}
      <rect x="392" y="206" width="56" height="15" rx="3" fill={C.asphaltDark} />
      {[400, 410, 420, 430, 440].map((x) => (
        <line key={x} x1={x} y1="209" x2={x} y2="218" stroke={C.ivory} strokeWidth="2" opacity=".8" />
      ))}
      {/* report card */}
      <rect x="48" y="28" width="132" height="64" rx="11" fill={C.ivory} stroke={C.maroon} strokeWidth="2.6" />
      <rect x="60" y="40" width="38" height="38" rx="6" fill={C.asphalt} />
      <ellipse cx="79" cy="66" rx="12" ry="4.5" fill={C.asphaltDark} />
      <rect x="108" y="42" width="58" height="6" rx="3" fill={C.line} />
      <rect x="108" y="53" width="40" height="6" rx="3" fill={C.line} />
      <rect x="108" y="66" width="44" height="12" rx="6" fill={C.greenSubtle} />
      <circle cx="116" cy="72" r="3.6" fill={C.green} />
      <path d="M182 62 q44 -4 62 70" stroke={C.maroon} strokeWidth="3" strokeLinecap="round" strokeDasharray="1 8" fill="none" />
      {/* pin on the pothole */}
      <ellipse cx="250" cy="249" rx="26" ry="6" fill="none" stroke={C.ivory} strokeWidth="2" opacity=".7" />
      <Pin x={250} y={248} size={1.05} />
    </svg>
  );
}

/** Privacy — an identity kept behind a shield. */
export function IllustrationPrivacy({ className }: Props) {
  return (
    <svg {...svgProps('0 0 200 150', className)}>
      <ellipse cx="100" cy="82" rx="86" ry="62" fill={C.rose} />
      <rect x="6" y="52" width="46" height="32" rx="7" fill={C.ivory} stroke={C.line} strokeWidth="2" />
      <circle cx="19" cy="65" r="5" fill={C.roseMid} />
      <rect x="28" y="61" width="18" height="5" rx="2.5" fill={C.line} />
      <rect x="28" y="70" width="12" height="5" rx="2.5" fill={C.line} />
      <rect x="148" y="68" width="46" height="32" rx="7" fill={C.ivory} stroke={C.line} strokeWidth="2" />
      <circle cx="161" cy="81" r="5" fill={C.roseMid} />
      <rect x="170" y="77" width="18" height="5" rx="2.5" fill={C.line} />
      <rect x="170" y="86" width="12" height="5" rx="2.5" fill={C.line} />
      <path d="M100 16 L148 33 V72 C148 102 127 121 100 133 C73 121 52 102 52 72 V33 Z" fill={C.maroon} />
      <path d="M100 26 L139 40 V72 C139 96 122 112 100 123 C78 112 61 96 61 72 V40 Z" fill={C.maroonBright} />
      <rect x="82" y="66" width="36" height="30" rx="6" fill={C.ivory} />
      <path d="M90 66 v-9 a10 10 0 0 1 20 0 v9" stroke={C.ivory} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <circle cx="100" cy="78" r="4" fill={C.maroon} />
      <rect x="98" y="80" width="4" height="9" rx="2" fill={C.maroon} />
    </svg>
  );
}

/** Report received. */
export function IllustrationSuccess({ className }: Props) {
  return (
    <svg {...svgProps('0 0 200 150', className)}>
      <circle cx="98" cy="80" r="56" fill={C.greenSubtle} />
      <circle cx="98" cy="80" r="56" fill="none" stroke={C.green} strokeWidth="3.5" />
      <path d="M70 80 l20 20 l40 -44" stroke={C.green} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M154 30 L190 14 L172 50 L163 38Z" fill={C.maroon} />
      <path d="M163 38 L190 14" stroke={C.ivory} strokeWidth="2" />
      <path d="M128 44 q16 -20 30 -12" stroke={C.maroon} strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" fill="none" />
      <circle cx="26" cy="46" r="5" fill={C.beige} />
      <circle cx="42" cy="124" r="4" fill={C.maroon} opacity=".7" />
      <rect x="164" y="104" width="9" height="9" rx="2" fill={C.beige} transform="rotate(20 168 108)" />
      <circle cx="176" cy="84" r="3.5" fill={C.roseMid} />
    </svg>
  );
}

/** Nothing here yet. */
export function IllustrationEmpty({ className }: Props) {
  return (
    <svg {...svgProps('0 0 200 150', className)}>
      <ellipse cx="100" cy="82" rx="84" ry="62" fill={C.rose} />
      <rect x="54" y="26" width="92" height="104" rx="11" fill={C.ivory} stroke={C.maroon} strokeWidth="3.5" />
      <rect x="82" y="17" width="36" height="16" rx="6" fill={C.maroon} />
      {[52, 72, 92].map((y, i) => (
        <g key={y}>
          <circle cx="74" cy={y + 4} r="4.6" fill="none" stroke={C.line} strokeWidth="2" strokeDasharray="3 3" />
          <rect x="86" y={y + 1} width={[48, 38, 44][i]} height="6" rx="3" fill={C.line} />
        </g>
      ))}
      <circle cx="138" cy="102" r="19" fill={C.ivory} stroke={C.maroon} strokeWidth="4.5" />
      <line x1="151.5" y1="115.5" x2="166" y2="130" stroke={C.maroon} strokeWidth="8" strokeLinecap="round" />
      <path d="M30 40 v10 M25 45 h10" stroke={C.beige} strokeWidth="3" strokeLinecap="round" />
      <path d="M176 36 v8 M172 40 h8" stroke={C.roseDeep} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Soft skyline for dark (maroon) backgrounds. Uses currentColor, so colour it with
 * a text utility, e.g. className="text-white/10".
 */
export function IllustrationSkyline({ className }: Props) {
  return (
    <svg {...svgProps('0 0 800 140', className)} preserveAspectRatio="xMidYMax slice">
      <g fill="currentColor">
        <rect x="0" y="80" width="46" height="60" />
        <rect x="52" y="52" width="36" height="88" />
        <rect x="94" y="94" width="50" height="46" />
        <path d="M168 140 V70 a34 34 0 0 1 68 0 V140Z" />
        <rect x="198" y="26" width="8" height="22" />
        <rect x="244" y="86" width="38" height="54" />
        <rect x="288" y="60" width="30" height="80" />
        {/* water tower */}
        <rect x="372" y="62" width="40" height="30" rx="6" />
        <rect x="378" y="92" width="4" height="48" />
        <rect x="402" y="92" width="4" height="48" />
        <rect x="324" y="100" width="40" height="40" />
        <rect x="428" y="76" width="44" height="64" />
        <rect x="478" y="98" width="52" height="42" />
        <circle cx="560" cy="102" r="26" />
        <rect x="557" y="120" width="6" height="20" />
        <rect x="596" y="64" width="34" height="76" />
        <rect x="636" y="88" width="48" height="52" />
        <path d="M700 140 V84 L726 56 L752 84 V140Z" />
        <rect x="758" y="100" width="42" height="40" />
      </g>
    </svg>
  );
}

export const ILLUSTRATIONS = {
  share: IllustrationShare,
  review: IllustrationReview,
  department: IllustrationDepartment,
  tracker: IllustrationTracker,
  ward: IllustrationWard,
  privacy: IllustrationPrivacy,
  success: IllustrationSuccess,
  empty: IllustrationEmpty,
  skyline: IllustrationSkyline,
} as const;

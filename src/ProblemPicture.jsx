// A picture of the math under a problem, for 1st grade and up (the toddler
// games have their own, ToddlerCount.jsx): ten-frames for adding and
// taking away within 20, place-value blocks for bigger numbers up to 999,
// a tray of cookies in rows for times and sharing, a "break it apart"
// area model for bigger times, a Singapore bar model for word problems,
// and for "which sign is correct?": two same-size pizzas for fractions, or
// the two numbers' place-value blocks. It shows the problem, not
// the answer: the last skip-count and the bar's total are "?".
// Returns null when a problem has no picture (big numbers).

const RED = '#e5484d';
const BLUE = '#3b6fef';

function TenFrames({ counters }) {
  // counters: [{ color, crossed }], up to 20, in frames of 10.
  const cell = 52;
  const frames = Math.max(1, Math.ceil(counters.length / 10));
  const fw = 5 * cell + 12;
  const fh = 2 * cell + 12;
  const gap = 18;
  return (
    <svg className="problem-picture-svg" viewBox={`0 0 ${fw} ${frames * fh + (frames - 1) * gap}`} aria-hidden="true">
      {Array.from({ length: frames }, (_, f) => {
        const y0 = f * (fh + gap);
        return (
          <g key={f}>
            <rect x="0" y={y0} width={fw} height={fh} rx="14" fill="#fff" fillOpacity=".95" />
            {Array.from({ length: 10 }, (_, k) => {
              const x = 6 + (k % 5) * cell;
              const y = y0 + 6 + Math.floor(k / 5) * cell;
              const c = counters[f * 10 + k];
              return (
                <g key={k}>
                  <rect x={x} y={y} width={cell} height={cell} fill="none" stroke="#cdd6e4" strokeWidth="2" />
                  {c && <circle cx={x + cell / 2} cy={y + cell / 2} r="18" fill={c.color} opacity={c.crossed ? 0.35 : 1} />}
                  {c?.crossed && (
                    <path
                      d={`M${x + 14} ${y + 14}L${x + cell - 14} ${y + cell - 14}M${x + cell - 14} ${y + 14}L${x + 14} ${y + cell - 14}`}
                      stroke="#171a2b"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function Cookie({ x, y, r }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#d18b47" />
      <circle cx={x} cy={y} r={r * 0.8} fill="#e6a35e" />
      <circle cx={x - r * 0.28} cy={y - r * 0.2} r={r * 0.16} fill="#5a3a1e" />
      <circle cx={x + r * 0.32} cy={y + r * 0.05} r={r * 0.16} fill="#5a3a1e" />
      <circle cx={x - r * 0.05} cy={y + r * 0.4} r={r * 0.13} fill="#5a3a1e" />
    </g>
  );
}

// `rows` rows of `cols` cookies on a tray; `labels` at the end of each row.
function CookieTray({ rows, cols, labels }) {
  const s = 36;
  const pad = 14;
  const labelW = labels ? 46 : 0;
  const w = cols * s + pad * 2 + labelW;
  const h = rows * s + pad * 2;
  return (
    <svg className="problem-picture-svg" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <rect x="2" y="2" width={w - 4} height={h - 4} rx="16" fill="#c98f5c" stroke="#8a5a34" strokeWidth="3" />
      <rect x="9" y="9" width={w - 18 - labelW} height={h - 18} rx="10" fill="#e9b97f" />
      {Array.from({ length: rows }, (_, r) => (
        <g key={r}>
          {Array.from({ length: cols }, (_, c) => (
            <Cookie key={c} x={pad + s / 2 + c * s} y={pad + s / 2 + r * s} r={s * 0.4} />
          ))}
          {labels && (
            <g>
              <rect x={w - labelW - 2} y={pad + r * s + 5} width={labelW - 6} height={s - 10} rx={(s - 10) / 2} fill="#fff" />
              <text
                x={w - labelW / 2 - 5}
                y={pad + r * s + s / 2 + 6}
                textAnchor="middle"
                fontFamily="Fredoka, sans-serif"
                fontWeight="700"
                fontSize="17"
                fill={BLUE}
              >
                {labels[r]}
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

// The bar model for a word problem: parts and the whole, the unknown "?".
function BarModel({ op, a, b }) {
  const W = 300;
  const label = (x, y, t, fill = '#fff', size = 18) => (
    <text x={x} y={y} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize={size} fill={fill}>
      {t}
    </text>
  );
  const brace = (x1, x2, y) => {
    const m = (x1 + x2) / 2;
    return <path d={`M${x1} ${y}q0 12 12 12H${m - 12}q12 0 12 12q0-12 12-12H${x2 - 12}q12 0 12-12`} stroke="#fff" strokeWidth="3" fill="none" />;
  };
  if (op === 'multiply') {
    // a groups of b.
    const n = Math.min(a, 10);
    const u = W / n;
    return (
      <svg className="problem-picture-svg" viewBox={`-2 0 ${W + 4} 108`} aria-hidden="true">
        {Array.from({ length: n }, (_, i) => (
          <g key={i}>
            <rect x={i * u} y="6" width={u} height="42" rx="6" fill={i % 2 ? '#ffd166' : '#ffc2d1'} stroke="#fff" strokeWidth="2" />
            {u > 24 && label(i * u + u / 2, 33, b, '#5a2b3b', u > 40 ? 18 : 14)}
          </g>
        ))}
        {brace(0, W, 54)}
        {label(W / 2, 102, '?', '#fff', 26)}
      </svg>
    );
  }
  if (op === 'subtract') {
    // The whole a, with b taken away: what's left is "?".
    const wb = Math.max(40, Math.min(W - 60, (b / a) * W));
    return (
      <svg className="problem-picture-svg" viewBox={`-2 0 ${W + 4} 116`} aria-hidden="true">
        {label(W / 2, 20, a)}
        <path d={`M0 30H${W}`} stroke="#fff" strokeWidth="3" />
        <path d={`M0 24v12M${W} 24v12`} stroke="#fff" strokeWidth="3" />
        <rect x="0" y="44" width={W - wb} height="42" rx="6" fill="#ffc2d1" />
        <rect x={W - wb} y="44" width={wb} height="42" rx="6" fill="#fff" fillOpacity=".35" stroke="#fff" strokeWidth="2" strokeDasharray="6 5" />
        {label((W - wb) / 2, 72, '?', '#5a2b3b', 24)}
        {label(W - wb / 2, 71, b)}
        {label(W - wb / 2, 108, 'taken away', '#fff', 14)}
      </svg>
    );
  }
  // Adding: two parts, the whole is "?".
  const wa = Math.max(50, Math.min(W - 50, (a / (a + b)) * W));
  return (
    <svg className="problem-picture-svg" viewBox={`-2 0 ${W + 4} 108`} aria-hidden="true">
      <rect x="0" y="6" width={wa} height="42" rx="6" fill="#ffc2d1" />
      <rect x={wa} y="6" width={W - wa} height="42" rx="6" fill="#ffd166" />
      {label(wa / 2, 34, a, '#5a2b3b')}
      {label(wa + (W - wa) / 2, 34, b, '#5a3a00')}
      {brace(0, W, 54)}
      {label(W / 2, 102, '?', '#fff', 26)}
    </svg>
  );
}

// Montessori place-value colors: ones green, tens blue, hundreds red.
const PV = { ones: '#2fae6b', tens: '#3b6fef', hundreds: '#e5484d' };

// One number as blocks: hundreds squares, tens rods, ones cubes. Drawn
// from x, y; returns [svg, width].
function blocks(n, x, y, faded) {
  const u = 7;
  const parts = [];
  let cx = x;
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;
  const op = faded ? 0.4 : 1;
  for (let i = 0; i < h; i++) {
    parts.push(
      <g key={`h${i}`} opacity={op}>
        <rect x={cx} y={y} width={10 * u} height={10 * u} rx="3" fill={PV.hundreds} />
        <path
          d={Array.from({ length: 9 }, (_, k) => `M${cx + (k + 1) * u} ${y}v${10 * u}M${cx} ${y + (k + 1) * u}h${10 * u}`).join('')}
          stroke="#fff"
          strokeOpacity=".35"
        />
      </g>,
    );
    cx += 10 * u + 6;
  }
  for (let i = 0; i < t; i++) {
    parts.push(
      <g key={`t${i}`} opacity={op}>
        <rect x={cx} y={y} width={u + 2} height={10 * u} rx="3" fill={PV.tens} />
        <path d={Array.from({ length: 9 }, (_, k) => `M${cx} ${y + (k + 1) * u}h${u + 2}`).join('')} stroke="#fff" strokeOpacity=".4" />
      </g>,
    );
    cx += u + 6;
  }
  if (o) {
    cx += 2;
    for (let i = 0; i < o; i++) {
      parts.push(<rect key={`o${i}`} x={cx + (i % 3) * (u + 4)} y={y + 10 * u - (Math.floor(i / 3) + 1) * (u + 4)} width={u + 2} height={u + 2} rx="2" fill={PV.ones} opacity={op} />);
    }
    cx += 3 * (u + 4);
  }
  return [parts, cx - x];
}

// a + b or a − b as place-value blocks, one number under the other.
function PlaceValue({ a, b, op }) {
  const labelW = 64;
  const [ga, wa] = blocks(a, labelW, 12, false);
  const [gb, wb] = blocks(b, labelW, 116, op === 'subtract');
  const w = labelW + Math.max(wa, wb, 120) + 8;
  const text = (x, y, t, size = 26) => (
    <text x={x} y={y} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize={size} fill="#fff">
      {t}
    </text>
  );
  // On a white board, so every block color shows on any card.
  return (
    <svg className="problem-picture-svg" viewBox={`0 0 ${w + 6} ${op === 'subtract' ? 212 : 196}`} aria-hidden="true">
      <rect x={labelW - 10} y="0" width={w - labelW + 16} height={op === 'subtract' ? 212 : 196} rx="16" fill="#fff" fillOpacity=".95" />
      {text(labelW / 2 - 8, 52, a)}
      {ga}
      {text(labelW / 2 - 8, 106, op === 'subtract' ? '−' : op === 'compare' ? '?' : '+', 30)}
      {text(labelW / 2 - 8, 156, b)}
      {gb}
      {op === 'subtract' && (
        <text x={labelW + wb / 2} y="204" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="14" fill="#6b7090">
          take away
        </text>
      )}
    </svg>
  );
}

// big × small, with big broken into its place values: 51 × 8 = 50 × 8 + 1 × 8.
function AreaModel({ big, small }) {
  const parts = String(big)
    .split('')
    .map((d, i, all) => Number(d) * 10 ** (all.length - 1 - i))
    .filter(Boolean);
  const W = 300;
  const total = parts.reduce((x, y) => x + y, 0);
  const min = 64;
  const widths = parts.map((p) => Math.max(min, (p / total) * W));
  const scale = W / widths.reduce((x, y) => x + y, 0);
  const colors = ['#ffd166', '#ffc2d1', '#a5d8ff'];
  let x = 34;
  const text = (tx, ty, t, size, fill = '#fff') => (
    <text x={tx} y={ty} textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize={size} fill={fill}>
      {t}
    </text>
  );
  return (
    <svg className="problem-picture-svg" viewBox={`0 0 ${W + 40} 178`} aria-hidden="true">
      {text(16, 104, small, 22)}
      {parts.map((p, i) => {
        const w = widths[i] * scale;
        const g = (
          <g key={i}>
            {text(x + w / 2, 24, p, 20)}
            <rect x={x} y="34" width={w} height="120" rx="8" fill={colors[i % 3]} stroke="#fff" strokeWidth="3" />
            {text(x + w / 2, 100, `${p} × ${small}`, w > 90 ? 18 : 14, '#3a2b5a')}
          </g>
        );
        x += w;
        return g;
      })}
      {text(W / 2 + 34, 174, 'Add the parts!', 15)}
    </svg>
  );
}

// Two pizzas the very same size, each cut into its fraction's slices with
// its slices shown (the rest is an empty plate): which has more pizza?
function FractionPizzas({ fractions }) {
  const R = 64;
  const pizza = ([num, den], cx, i) => {
    const cy = 82;
    const at = (k, r) => {
      const ang = (k / den) * Math.PI * 2 - Math.PI / 2;
      return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
    };
    return (
      <g key={i}>
        <circle cx={cx} cy={cy} r={R + 7} fill="#fff" fillOpacity=".22" />
        {Array.from({ length: den }, (_, k) => {
          const [x0, y0] = at(k, R);
          const [x1, y1] = at(k + 1, R);
          const has = k < num;
          const [px, py] = at(k + 0.5, R * 0.58);
          return (
            <g key={k}>
              <path
                d={den === 1 ? `M${cx - R} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0` : `M${cx} ${cy}L${x0} ${y0}A${R} ${R} 0 0 1 ${x1} ${y1}Z`}
                fill={has ? '#ffcf6e' : '#fff'}
                fillOpacity={has ? 1 : 0.18}
                stroke={has ? '#e2a85a' : '#fff'}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              {has && <circle cx={px} cy={py} r={Math.max(4, 12 - den)} fill="#e5484d" />}
            </g>
          );
        })}
        <text x={cx} y="182" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="26" fill="#fff">
          {num}/{den}
        </text>
      </g>
    );
  };
  return (
    <svg className="problem-picture-svg" viewBox="0 0 300 192" aria-hidden="true">
      {pizza(fractions[0], 74, 0)}
      {pizza(fractions[1], 226, 1)}
    </svg>
  );
}

function fractionParts(text) {
  const m = /^(\d+)\/(\d+)$/.exec(String(text));
  if (!m) return null;
  const [num, den] = [Number(m[1]), Number(m[2])];
  return den >= 1 && den <= 12 && num <= den ? [num, den] : null;
}

export function problemPicture(problem) {
  if (!problem || problem.toddler || problem.lang === 'ja') return null;
  if (problem.type === 'sentence' && problem.numbers) {
    const [a, b] = problem.numbers;
    return <BarModel op={problem.op} a={a} b={b} />;
  }
  if (problem.promptKind === 'compare') {
    const [l, r] = [fractionParts(problem.compareLeft), fractionParts(problem.compareRight)];
    if (l && r) return <FractionPizzas fractions={[l, r]} />;
    // Whole numbers up to 999 (written as numbers or text).
    const whole = (v) => (/^\d{1,3}$/.test(String(v)) ? Number(v) : null);
    const [x, y] = [whole(problem.compareLeft), whole(problem.compareRight)];
    if (x !== null && y !== null) return <PlaceValue a={x} b={y} op="compare" />;
    return null;
  }
  if (problem.type) return null;
  const { op, a, b } = problem;
  if ((op === 'add' || op === 'subtract') && a <= 999 && b <= 999 && !(op === 'add' && a <= 10 && b <= 10) && !(op === 'subtract' && a <= 20)) {
    return <PlaceValue a={a} b={b} op={op} />;
  }
  if (op === 'add' && a <= 10 && b <= 10) {
    const counters = [...Array(a).fill({ color: RED }), ...Array(b).fill({ color: BLUE })];
    return <TenFrames counters={counters} />;
  }
  if (op === 'subtract' && a <= 20 && b <= a) {
    const counters = Array.from({ length: a }, (_, i) => ({ color: RED, crossed: i >= a - b }));
    return <TenFrames counters={counters} />;
  }
  if (op === 'multiply' && Math.max(a, b) > 12 && Math.min(a, b) <= 12 && Math.max(a, b) <= 999) {
    return <AreaModel big={Math.max(a, b)} small={Math.min(a, b)} />;
  }
  if (op === 'multiply' && a >= 1 && a <= 10 && b >= 1 && b <= 12) {
    const labels = Array.from({ length: a }, (_, r) => (r === a - 1 ? '?' : String((r + 1) * b)));
    return <CookieTray rows={a} cols={b} labels={labels} />;
  }
  if (op === 'divide' && b >= 1 && a / b <= 10 && b <= 12 && a <= 72) {
    // a cookies, in rows of b: how many rows?
    return <CookieTray rows={a / b} cols={b} />;
  }
  return null;
}

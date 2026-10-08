// The picture above a topic question (topics.js `visual`): ten frames,
// coins, rulers, shapes, angles, graphs... Drawn on a white panel so it
// reads the same on every card colour, and on printed worksheets.

const INK = '#1F2340';
const SOFT = '#C9CEE0';
const BLUE = '#3B6FEF';
const FILL = '#7FA3F7';

function Panel({ children, wide }) {
  return <span className={`tv${wide ? ' tv-wide' : ''}`}>{children}</span>;
}

function polygonPoints(n, cx, cy, r, rot = -90) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((rot + (360 / n) * i) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

function TenFrames({ n }) {
  const frames = n > 10 ? 2 : 1;
  return (
    <svg viewBox={`0 0 ${frames * 130 - 10} 56`} className="tv-svg" role="img" aria-label={`${n} dots`}>
      {Array.from({ length: frames }, (_, f) => (
        <g key={f} transform={`translate(${f * 130} 3)`}>
          {Array.from({ length: 10 }, (_, i) => {
            const x = (i % 5) * 24;
            const y = Math.floor(i / 5) * 24;
            const filled = f * 10 + i < n;
            return (
              <g key={i}>
                <rect x={x} y={y} width="24" height="24" fill="#fff" stroke={INK} strokeWidth="1.5" />
                {filled && <circle cx={x + 12} cy={y + 12} r="8" fill="#E0577F" />}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

function Ruler({ start, len, color }) {
  const cm = 26;
  const total = 14;
  const x0 = 10;
  return (
    <svg viewBox={`0 0 ${total * cm + 20} 78`} className="tv-svg" role="img" aria-label="A ruler">
      <rect x={x0 + start * cm} y="6" width={len * cm} height="16" rx="8" fill={color} />
      <rect x={x0 - 6} y="30" width={total * cm + 12} height="44" rx="4" fill="#FFE9A8" stroke="#D9B44A" />
      {Array.from({ length: total * 2 + 1 }, (_, i) => {
        const x = x0 + (i * cm) / 2;
        const whole = i % 2 === 0;
        return (
          <g key={i}>
            <line x1={x} y1="30" x2={x} y2={whole ? 46 : 40} stroke={INK} strokeWidth="1.3" />
            {whole && (
              <text x={x} y="64" fontSize="13" textAnchor="middle" fill={INK} fontWeight="600">
                {i / 2}
              </text>
            )}
          </g>
        );
      })}
      <text x={total * cm + 8} y="64" fontSize="10" textAnchor="end" fill={INK}>
        cm
      </text>
    </svg>
  );
}

function Rect({ w, h, hideH }) {
  const scale = Math.min(200 / w, 110 / h);
  const W = w * scale;
  const H = h * scale;
  return (
    <svg viewBox={`0 0 ${W + 90} ${H + 50}`} className="tv-svg tv-svg-shape" role="img" aria-label={`Rectangle ${w} by ${h}`}>
      <rect x="40" y="12" width={W} height={H} fill="#DCE6FD" stroke={BLUE} strokeWidth="3" />
      <text x={40 + W / 2} y={H + 38} fontSize="16" textAnchor="middle" fill={INK} fontWeight="700">
        {w} cm
      </text>
      <text x={48 + W} y={12 + H / 2 + 5} fontSize="16" fill={INK} fontWeight="700">
        {hideH ? '? cm' : `${h} cm`}
      </text>
    </svg>
  );
}

// A rectangle with its top-right corner cut out. Only the outside sides
// are labelled; the cut-out's sides are found from them, Singapore style.
function LShape({ w, h, cw, ch }) {
  const scale = Math.min(190 / w, 120 / h);
  const X = (v) => 40 + v * scale;
  const Y = (v) => 26 + v * scale;
  const pts = [
    [0, 0],
    [w - cw, 0],
    [w - cw, ch],
    [w, ch],
    [w, h],
    [0, h],
  ];
  const label = (x, y, text, anchor = 'middle') => (
    <text x={x} y={y} fontSize="14" textAnchor={anchor} fill={INK} fontWeight="700">
      {text}
    </text>
  );
  return (
    <svg viewBox={`0 0 ${X(w) + 60} ${Y(h) + 34}`} className="tv-svg tv-svg-shape" role="img" aria-label="An L-shaped figure">
      <polygon points={pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')} fill="#DCE6FD" stroke={BLUE} strokeWidth="3" />
      {label(X(w / 2), Y(h) + 22, `${w} cm`)}
      {label(X(0) - 6, Y(h / 2) + 5, `${h} cm`, 'end')}
      {label(X((w - cw) / 2), Y(0) - 7, `${w - cw} cm`)}
      {label(X(w) + 6, Y(ch + (h - ch) / 2) + 5, `${h - ch} cm`, 'start')}
    </svg>
  );
}

function Grid({ cols, rows, cells }) {
  const s = 30;
  return (
    <svg viewBox={`0 0 ${cols * s + 4} ${rows * s + 4}`} className="tv-svg tv-svg-shape" role="img" aria-label="Squares on a grid">
      {Array.from({ length: cols * rows }, (_, i) => (
        <rect
          key={i}
          x={2 + (i % cols) * s}
          y={2 + Math.floor(i / cols) * s}
          width={s}
          height={s}
          fill={cells.includes(i) ? FILL : '#fff'}
          stroke={SOFT}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

function Angle({ deg }) {
  const cx = 60;
  const cy = 120;
  const r = 100;
  const a = (deg * Math.PI) / 180;
  const ex = cx + r * Math.cos(-a);
  const ey = cy + r * Math.sin(-a);
  return (
    <svg viewBox="0 0 220 130" className="tv-svg tv-svg-shape" role="img" aria-label="An angle">
      <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={INK} strokeWidth="4" strokeLinecap="round" />
      {deg === 90 ? (
        <path d={`M${cx + 18} ${cy} V${cy - 18} H${cx}`} fill="none" stroke={BLUE} strokeWidth="2.5" />
      ) : (
        <path
          d={`M${cx + 22} ${cy} A22 22 0 0 0 ${cx + 22 * Math.cos(-a)} ${cy + 22 * Math.sin(-a)}`}
          fill="none"
          stroke={BLUE}
          strokeWidth="2.5"
        />
      )}
    </svg>
  );
}

// A right angle or straight line split in two, one part labelled.
function AngleSplit({ total, known }) {
  const cx = total === 90 ? 50 : 120;
  const cy = 120;
  const r = 95;
  const ray = (d) => [cx + r * Math.cos((-d * Math.PI) / 180), cy + r * Math.sin((-d * Math.PI) / 180)];
  const [mx, my] = ray(known);
  const [ex, ey] = ray(total);
  const lab = (d, text) => {
    const rad = (-d * Math.PI) / 180;
    return (
      <text x={cx + 44 * Math.cos(rad)} y={cy + 44 * Math.sin(rad) + 5} fontSize="15" textAnchor="middle" fill={INK} fontWeight="700">
        {text}
      </text>
    );
  };
  return (
    <svg viewBox={`0 0 ${total === 90 ? 170 : 240} 132`} className="tv-svg tv-svg-shape" role="img" aria-label="Two angles">
      <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={mx} y2={my} stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
      {total === 90 && <path d={`M${cx + 14} ${cy} V${cy - 14} H${cx}`} fill="none" stroke={INK} strokeWidth="2" />}
      {lab(known / 2, `${known}°`)}
      {lab(known + (total - known) / 2, '?')}
    </svg>
  );
}

function Compass() {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return (
    <svg viewBox="0 0 150 150" className="tv-svg tv-svg-small" role="img" aria-label="A compass">
      <circle cx="75" cy="75" r="46" fill="#F3F5FB" stroke={SOFT} strokeWidth="2" />
      {dirs.map((d, i) => {
        const a = ((i * 45 - 90) * Math.PI) / 180;
        return (
          <g key={d}>
            <line x1="75" y1="75" x2={75 + 40 * Math.cos(a)} y2={75 + 40 * Math.sin(a)} stroke={i % 2 ? SOFT : INK} strokeWidth={i % 2 ? 2 : 3} />
            <text x={75 + 62 * Math.cos(a)} y={75 + 62 * Math.sin(a) + 5} fontSize={i % 2 ? 11 : 15} textAnchor="middle" fill={INK} fontWeight="700">
              {d}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const QUAD_POINTS = {
  square: '40,20 140,20 140,120 40,120',
  rectangle: '15,35 175,35 175,115 15,115',
  rhombus: '95,10 160,70 95,130 30,70',
  trapezoid: '55,30 135,30 175,115 15,115',
  parallelogram: '50,30 180,30 140,115 10,115',
};

const TRIANGLE_POINTS = {
  equilateral: '95,15 160,128 30,128',
  isosceles: '95,10 135,128 55,128',
  right: '40,15 40,128 170,128',
};

function Shape({ points, children }) {
  return (
    <svg viewBox="0 0 190 140" className="tv-svg tv-svg-shape" role="img" aria-label="A shape">
      <polygon points={points} fill="#DCE6FD" stroke={BLUE} strokeWidth="4" strokeLinejoin="round" />
      {children}
    </svg>
  );
}

function Lines({ type, rot }) {
  let second;
  if (type === 'parallel') second = <line x1="-80" y1="30" x2="80" y2="30" />;
  else if (type === 'perpendicular') second = <line x1="0" y1="-60" x2="0" y2="60" />;
  else second = <line x1="-80" y1="40" x2="80" y2="-5" />;
  return (
    <svg viewBox="-100 -70 200 140" className="tv-svg tv-svg-shape" role="img" aria-label="Two lines">
      <g transform={`rotate(${rot})`} stroke={INK} strokeWidth="4" strokeLinecap="round">
        <line x1="-80" y1={type === 'parallel' ? -20 : 0} x2="80" y2={type === 'parallel' ? -20 : 0} />
        <g stroke={BLUE}>{second}</g>
      </g>
    </svg>
  );
}

function FractionShape({ shape, parts, shaded }) {
  if (shape === 'circle') {
    const cx = 70;
    const cy = 70;
    const r = 60;
    return (
      <svg viewBox="0 0 140 140" className="tv-svg tv-svg-small" role="img" aria-label={`A circle in ${parts} parts`}>
        {Array.from({ length: parts }, (_, i) => {
          const a0 = (i / parts) * 2 * Math.PI - Math.PI / 2;
          const a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
          const d = `M${cx} ${cy} L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
          return <path key={i} d={d} fill={i < shaded ? '#F5A623' : '#fff'} stroke={INK} strokeWidth="2" />;
        })}
      </svg>
    );
  }
  const w = 260 / parts;
  return (
    <svg viewBox="0 0 270 60" className="tv-svg" role="img" aria-label={`A bar in ${parts} parts`}>
      {Array.from({ length: parts }, (_, i) => (
        <rect key={i} x={5 + i * w} y="5" width={w} height="50" fill={i < shaded ? '#F5A623' : '#fff'} stroke={INK} strokeWidth="2" />
      ))}
    </svg>
  );
}

function NumberLine({ from, to, mark }) {
  const n = to - from;
  const step = 300 / n;
  const X = (v) => 15 + (v - from) * step;
  return (
    <svg viewBox="0 0 330 70" className="tv-svg" role="img" aria-label="A number line">
      <line x1="8" y1="40" x2="322" y2="40" stroke={INK} strokeWidth="2" />
      {Array.from({ length: n + 1 }, (_, i) => {
        const v = from + i;
        return (
          <g key={v}>
            <line x1={X(v)} y1={v === 0 ? 32 : 35} x2={X(v)} y2={v === 0 ? 48 : 45} stroke={INK} strokeWidth={v === 0 ? 2.5 : 1.5} />
            {v % 5 === 0 && (
              <text x={X(v)} y="62" fontSize="11" textAnchor="middle" fill={INK} fontWeight="600">
                {v < 0 ? `−${-v}` : v}
              </text>
            )}
          </g>
        );
      })}
      {mark !== undefined && <path d={`M${X(mark)} 30 l-7 -14 h14 z`} fill="#E0577F" />}
    </svg>
  );
}

const NOTE_COLORS = { 100: '#8FCB9B', 200: '#B9A6E6', 500: '#F2A6A6', 1000: '#F7C873' };

function Money({ items }) {
  return (
    <span className="tv-money" role="img" aria-label="Coins and notes">
      {items.map((c, i) =>
        c >= 200 || (c === 100 && items.every((x) => x >= 100)) ? (
          <span key={i} className="tv-note" style={{ background: NOTE_COLORS[c] || '#ddd' }}>
            ${c / 100}
          </span>
        ) : (
          <span key={i} className={`tv-coin tv-coin-${c}`}>
            {c === 100 ? '$1' : `${c}¢`}
          </span>
        ),
      )}
    </span>
  );
}

function Pictograph({ title, rows, per }) {
  return (
    <span className="tv-graph">
      <span className="tv-graph-title">{title}</span>
      {rows.map((r) => (
        <span key={r.emoji} className="tv-picto-row">
          <span className="tv-picto-label">{r.emoji}</span>
          <span className="tv-picto-items">
            {Array.from({ length: r.value / per }, (_, i) => (
              <span key={i}>●</span>
            ))}
          </span>
        </span>
      ))}
      <span className="tv-graph-key">● = {per}</span>
    </span>
  );
}

function Bars({ title, rows, step }) {
  const max = Math.max(...rows.map((r) => r.value));
  const top = Math.ceil(max / step + 1) * step;
  const ticks = Math.round(top / step);
  const every = ticks > 10 ? 2 : 1;
  const H = 150;
  const Y = (v) => 10 + H - (v / top) * H;
  const bw = 44;
  return (
    <span className="tv-graph">
      <span className="tv-graph-title">{title}</span>
      <svg viewBox={`0 0 ${50 + rows.length * 62} ${H + 46}`} className="tv-svg" role="img" aria-label="A bar graph">
        {Array.from({ length: ticks + 1 }, (_, i) => (
          <g key={i}>
            <line x1="40" y1={Y(i * step)} x2={44 + rows.length * 62} y2={Y(i * step)} stroke="#E4E7F2" />
            {i % every === 0 && (
              <text x="34" y={Y(i * step) + 4} fontSize="11" textAnchor="end" fill={INK}>
                {i * step}
              </text>
            )}
          </g>
        ))}
        <line x1="40" y1="10" x2="40" y2={Y(0)} stroke={INK} strokeWidth="1.5" />
        <line x1="40" y1={Y(0)} x2={44 + rows.length * 62} y2={Y(0)} stroke={INK} strokeWidth="1.5" />
        {rows.map((r, i) => (
          <g key={r.emoji}>
            <rect x={52 + i * 62} y={Y(r.value)} width={bw} height={Y(0) - Y(r.value)} fill={['#4E8FF7', '#F5A623', '#2FAE6B', '#E0577F'][i]} rx="3" />
            <text x={52 + i * 62 + bw / 2} y={H + 36} fontSize="20" textAnchor="middle">
              {r.emoji}
            </text>
          </g>
        ))}
      </svg>
    </span>
  );
}

export default function TopicVisual({ v }) {
  if (!v) return null;
  switch (v.kind) {
    case 'tenFrames':
      return (
        <Panel>
          <TenFrames n={v.n} />
        </Panel>
      );
    case 'line':
      return (
        <Panel wide>
          <span className="tv-line">
            <span className="tv-line-left">left</span>
            {v.items.map((e, i) => (
              <span key={i}>{e}</span>
            ))}
          </span>
        </Panel>
      );
    case 'groups':
      return (
        <Panel wide>
          <span className="tv-groups">
            {Array.from({ length: v.groups }, (_, g) => (
              <span key={g} className="tv-group">
                {Array.from({ length: v.each }, (_, i) => (
                  <span key={i}>{v.emoji}</span>
                ))}
              </span>
            ))}
          </span>
        </Panel>
      );
    case 'pile':
      return (
        <Panel wide>
          <span className="tv-pile">
            {Array.from({ length: v.n }, (_, i) => (
              <span key={i}>{v.emoji}</span>
            ))}
          </span>
        </Panel>
      );
    case 'square':
      return (
        <Panel>
          <Grid cols={v.n} rows={v.n} cells={Array.from({ length: v.n * v.n }, (_, i) => i)} />
        </Panel>
      );
    case 'numberLine':
      return (
        <Panel wide>
          <NumberLine from={v.from} to={v.to} mark={v.mark} />
        </Panel>
      );
    case 'fraction':
      return (
        <Panel>
          <FractionShape shape={v.shape} parts={v.parts} shaded={v.shaded} />
        </Panel>
      );
    case 'money':
      return (
        <Panel wide>
          <Money items={v.items} />
        </Panel>
      );
    case 'ruler':
      return (
        <Panel wide>
          <Ruler start={v.start} len={v.len} color={v.color} />
        </Panel>
      );
    case 'rect':
      return (
        <Panel>
          <Rect w={v.w} h={v.h} hideH={v.hideH} />
        </Panel>
      );
    case 'lshape':
      return (
        <Panel>
          <LShape w={v.w} h={v.h} cw={v.cw} ch={v.ch} />
        </Panel>
      );
    case 'grid':
      return (
        <Panel>
          <Grid cols={v.cols} rows={v.rows} cells={v.cells} />
        </Panel>
      );
    case 'angle':
      return (
        <Panel>
          <Angle deg={v.deg} />
        </Panel>
      );
    case 'angleSplit':
      return (
        <Panel>
          <AngleSplit total={v.total} known={v.known} />
        </Panel>
      );
    case 'compass':
      return (
        <Panel>
          <Compass />
        </Panel>
      );
    case 'polygon':
      return (
        <Panel>
          <Shape points={polygonPoints(v.sides, 95, v.sides === 3 ? 80 : 70, 62, v.sides === 4 ? -45 : -90)} />
        </Panel>
      );
    case 'quad':
      return v.shape ? (
        <Panel>
          <Shape points={QUAD_POINTS[v.shape]} />
        </Panel>
      ) : null;
    case 'triangle':
      return (
        <Panel>
          <Shape points={TRIANGLE_POINTS[v.type]}>
            {v.type === 'right' && <path d="M40 112 H56 V128" fill="none" stroke={INK} strokeWidth="2" />}
          </Shape>
        </Panel>
      );
    case 'lines':
      return (
        <Panel>
          <Lines type={v.type} rot={v.rot} />
        </Panel>
      );
    case 'letter':
      return (
        <Panel>
          <span className="tv-letter">{v.letter}</span>
        </Panel>
      );
    case 'table':
      return (
        <Panel>
          <span className="tv-table" style={{ gridTemplateColumns: `auto repeat(${v.cols}, 1fr)` }}>
            <span />
            {Array.from({ length: v.cols }, (_, c) => (
              <span key={c} className="tv-table-head">
                {c + 1}
              </span>
            ))}
            {Array.from({ length: v.rows }, (_, r) => [
              <span key={`h${r}`} className="tv-table-head">
                {r + 1}
              </span>,
              ...Array.from({ length: v.cols }, (_, c) => (
                <span key={`${r}-${c}`} className="tv-table-cell">
                  {v.items[r * v.cols + c]}
                </span>
              )),
            ])}
          </span>
        </Panel>
      );
    case 'pictograph':
      return (
        <Panel wide>
          <Pictograph title={v.title} rows={v.rows} per={v.per} />
        </Panel>
      );
    case 'bars':
      return (
        <Panel wide>
          <Bars title={v.title} rows={v.rows} step={v.step} />
        </Panel>
      );
    case 'bag':
      return (
        <Panel>
          <span className="tv-bag">
            {v.bag.flatMap((b) => Array.from({ length: b.n }, (_, i) => <span key={`${b.emoji}${i}`}>{b.emoji}</span>))}
          </span>
        </Panel>
      );
    default:
      return null;
  }
}

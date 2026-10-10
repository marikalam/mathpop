// The picture in "Show me how" (ExplainPanel.jsx), for the problems a
// drawing explains best: comparing numbers (place-value blocks, with the
// place that decides it highlighted), times (rows of dots) and sharing
// (dots in equal groups). Nothing for other problems. Before the child
// answers (`reveal` false) it doesn't show the answer.

const COLORS = { hundreds: '#8E4FD6', tens: '#3B6FEF', ones: '#F0954F' };
const PLACE_NAMES = ['hundreds', 'tens', 'ones'];

const toInt = (v) => {
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isInteger(n) && n >= 0 && n <= 999 ? n : null;
};

// One number as blocks: flats (100), rods (10) and cubes (1).
function Blocks({ n, highlight }) {
  const h = Math.floor(n / 100);
  const t = Math.floor(n / 10) % 10;
  const o = n % 10;
  const group = (place, count, draw) =>
    count > 0 && (
      <div className={`ep-group${highlight === place ? ' ep-group-now' : ''}`}>
        <div className={`ep-group-items ep-items-${place}`}>{Array.from({ length: count }, (_, i) => draw(i))}</div>
        <span className="ep-group-label">
          {count} {count === 1 ? place.slice(0, -1) : place}
        </span>
      </div>
    );
  return (
    <div className="ep-number">
      <span className="ep-number-label">{n}</span>
      <div className="ep-groups">
        {group('hundreds', h, (i) => (
          <span key={i} className="ep-flat" style={{ background: COLORS.hundreds }} />
        ))}
        {group('tens', t, (i) => (
          <span key={i} className="ep-rod" style={{ background: COLORS.tens }} />
        ))}
        {group('ones', o, (i) => (
          <span key={i} className="ep-cube" style={{ background: COLORS.ones }} />
        ))}
        {n === 0 && <span className="ep-group-label">nothing</span>}
      </div>
    </div>
  );
}

function ComparePicture({ a, b, reveal }) {
  // The first place, from the biggest, where the digits differ.
  const pad = (n) => String(n).padStart(3, '0');
  const da = pad(a);
  const db = pad(b);
  const i = [0, 1, 2].find((k) => da[k] !== db[k]);
  const place = i === undefined ? null : PLACE_NAMES[i];
  const sign = a < b ? '<' : a > b ? '>' : '=';
  // "Same tens → look at the ones: 3 < 8" (only places the numbers have).
  const same = i === undefined ? [] : PLACE_NAMES.slice(0, i).filter((_, k) => da[k] !== '0');
  // Before she answers, the picture asks instead of telling.
  const shown = reveal ? sign : '?';
  const caption = !place
    ? reveal
      ? 'Every place is the same'
      : 'Look at every place. Are any different?'
    : `${same.length ? `Same ${same.join(' and ')} → l` : 'L'}ook at the ${place}: ${da[i]} ${reveal ? sign : 'or'} ${db[i]}${reveal ? '' : '?'}`;
  return (
    <figure className="ep-figure" aria-label={`${a} and ${b} as blocks`}>
      <div className="ep-compare">
        <Blocks n={a} highlight={place} />
        <span className="ep-sign">{shown}</span>
        <Blocks n={b} highlight={place} />
      </div>
      <figcaption className="ep-caption">{caption}</figcaption>
    </figure>
  );
}

// a rows of b dots.
function TimesPicture({ a, b, reveal }) {
  return (
    <figure className="ep-figure" aria-label={`${a} rows of ${b}`}>
      <div className="ep-array" style={{ gridTemplateColumns: `auto repeat(${b}, 1fr)` }}>
        {Array.from({ length: a }, (_, r) => [
          <span key={`l${r}`} className="ep-row-count">
            {r < a - 1 || reveal ? (r + 1) * b : '?'}
          </span>,
          ...Array.from({ length: b }, (_, c) => <span key={`${r}-${c}`} className="ep-dot" />),
        ])}
      </div>
      <figcaption className="ep-caption">
        {a} rows of {b} — count along the side: {b}, {Math.min(2, a) * b}
        {a > 2 ? ', …' : ''}
      </figcaption>
    </figure>
  );
}

// a dots shared into b equal groups.
function SharePicture({ a, b }) {
  const each = a / b;
  return (
    <figure className="ep-figure" aria-label={`${a} shared into ${b} groups`}>
      <div className="ep-share">
        {Array.from({ length: b }, (_, g) => (
          <div key={g} className="ep-share-group">
            {Array.from({ length: each }, (_, i) => (
              <span key={i} className="ep-dot" />
            ))}
          </div>
        ))}
      </div>
      <figcaption className="ep-caption">
        {a} shared into {b} equal groups — how many in each?
      </figcaption>
    </figure>
  );
}

export default function ExplainPicture({ problem, reveal = false }) {
  if (problem.promptKind === 'compare') {
    const a = toInt(problem.compareLeft);
    const b = toInt(problem.compareRight);
    if (a !== null && b !== null) return <ComparePicture a={a} b={b} reveal={reveal} />;
    return null;
  }
  if (problem.type === 'skill' || problem.type === 'sentence' || problem.type === 'clock') return null;
  if (problem.op === 'multiply' && problem.a <= 10 && problem.b <= 10 && problem.a > 0 && problem.b > 0) {
    // Fewer, longer rows fit a phone better.
    const [rows, cols] = problem.a <= problem.b ? [problem.a, problem.b] : [problem.b, problem.a];
    return <TimesPicture a={rows} b={cols} reveal={reveal} />;
  }
  if (problem.op === 'divide' && problem.a <= 60 && problem.b >= 2 && problem.b <= 6 && problem.a % problem.b === 0) {
    return <SharePicture a={problem.a} b={problem.b} />;
  }
  return null;
}

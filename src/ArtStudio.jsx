import { useEffect, useRef, useState } from 'react';
import { playStickerPick, playStickerStick, speak } from './sound.js';
import { setBackHandler } from './backButton.js';

// Art Studio: a drawing app for little kids. Pens (3 sizes), a rainbow
// pen, an eraser, a paint bucket that fills a closed space, and shape
// stamps; mirror drawing (2 sides or 4: symmetry); undo and start over.
// Every tool says its name when tapped (for kids who can't read yet). The
// drawing in progress saves itself; Save puts it in the player's gallery
// (on this device), where it can be opened again or deleted.

const COLORS = ['#111827', '#ffffff', '#ef4444', '#f97316', '#facc15', '#84cc16', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f9a8d4', '#a16207', '#9ca3af'];
const SIZES = [
  [4, 'Thin'],
  [10, 'Medium'],
  [22, 'Thick'],
];
const TOOLS = [
  ['pen', 'Pen'],
  ['rainbow', 'Rainbow pen'],
  ['fill', 'Paint bucket. Tap inside a shape to fill it with color'],
  ['stamp', 'Stamps. Tap to stamp a shape'],
  ['eraser', 'Eraser'],
];
const STAMPS = ['circle', 'square', 'triangle', 'star', 'heart'];
const MIRRORS = [
  [1, 'Mirror off'],
  [2, 'Mirror! Draw on one side and it copies to the other side. That is called symmetry!'],
  [4, 'Four-way mirror! Draw in one corner and it copies to all four. Like a snowflake!'],
];
const W = 900;
const H = 1100;
const MAX_SAVED = 12;
const KEY = 'mathpop-art-v1';

function readArt(id) {
  try {
    return (JSON.parse(localStorage.getItem(KEY)) || {})[id] || { current: null, saved: [] };
  } catch {
    return { current: null, saved: [] };
  }
}
function writeArt(id, art) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY)) || {};
    all[id] = art;
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
// Fill the space around (x, y) that has the same color, with a little
// give so antialiased edges fill too.
function floodFill(ctx, x, y, hex) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const i0 = (y * W + x) * 4;
  const [r0, g0, b0, a0] = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
  const [r, g, b] = hexRgb(hex);
  if (Math.abs(r0 - r) + Math.abs(g0 - g) + Math.abs(b0 - b) < 12 && a0 === 255) return;
  const same = (i) => Math.abs(d[i] - r0) + Math.abs(d[i + 1] - g0) + Math.abs(d[i + 2] - b0) + Math.abs(d[i + 3] - a0) < 90;
  const seen = new Uint8Array(W * H);
  const stack = [x, y];
  while (stack.length) {
    const cy = stack.pop();
    let cx = stack.pop();
    while (cx > 0 && !seen[cy * W + cx - 1] && same((cy * W + cx - 1) * 4)) cx--;
    let up = false;
    let down = false;
    for (; cx < W && !seen[cy * W + cx] && same((cy * W + cx) * 4); cx++) {
      const p = cy * W + cx;
      seen[p] = 1;
      d[p * 4] = r;
      d[p * 4 + 1] = g;
      d[p * 4 + 2] = b;
      d[p * 4 + 3] = 255;
      if (cy > 0) {
        const q = p - W;
        const ok = !seen[q] && same(q * 4);
        if (ok && !up) stack.push(cx, cy - 1);
        up = ok;
      }
      if (cy < H - 1) {
        const q = p + W;
        const ok = !seen[q] && same(q * 4);
        if (ok && !down) stack.push(cx, cy + 1);
        down = ok;
      }
    }
  }
  // Grow the fill one pixel into the edges it stopped at, so there's no
  // white halo next to the lines.
  const grow = [];
  for (let p = 0; p < W * H; p++) {
    if (seen[p]) continue;
    const px = p % W;
    if ((px > 0 && seen[p - 1]) || (px < W - 1 && seen[p + 1]) || (p >= W && seen[p - W]) || (p < W * (H - 1) && seen[p + W])) grow.push(p);
  }
  for (const p of grow) {
    const a = d[p * 4 + 3];
    if (a < 255 || Math.abs(d[p * 4] - r0) + Math.abs(d[p * 4 + 1] - g0) + Math.abs(d[p * 4 + 2] - b0) < 260) {
      d[p * 4] = r;
      d[p * 4 + 1] = g;
      d[p * 4 + 2] = b;
      d[p * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function stampPath(ctx, kind, x, y, s) {
  ctx.beginPath();
  if (kind === 'circle') ctx.arc(x, y, s, 0, Math.PI * 2);
  else if (kind === 'square') ctx.rect(x - s, y - s, s * 2, s * 2);
  else if (kind === 'triangle') {
    ctx.moveTo(x, y - s * 1.1);
    ctx.lineTo(x + s * 1.1, y + s * 0.8);
    ctx.lineTo(x - s * 1.1, y + s * 0.8);
    ctx.closePath();
  } else if (kind === 'star') {
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 ? s * 0.45 : s * 1.15;
      ctx[k ? 'lineTo' : 'moveTo'](x + rr * Math.cos(a), y + rr * Math.sin(a));
    }
    ctx.closePath();
  } else {
    ctx.moveTo(x, y + s);
    ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.3, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s);
  }
}

function ToolIcon({ id }) {
  const common = { width: 30, height: 30, viewBox: '0 0 24 24', 'aria-hidden': true };
  if (id === 'pen')
    return (
      <svg {...common}>
        <path d="M4 20l1-5L16 4l4 4L9 19z" fill="#facc15" stroke="#173a66" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M4 20l1-5 4 4z" fill="#173a66" />
      </svg>
    );
  if (id === 'rainbow')
    return (
      <svg {...common}>
        {['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6'].map((c, k) => (
          <path key={c} d={`M${3 + k * 1.2} 19a${9 - k * 1.2} ${9 - k * 1.2} 0 0 1 ${18 - k * 2.4} 0`} stroke={c} strokeWidth="1.7" fill="none" />
        ))}
      </svg>
    );
  if (id === 'fill')
    return (
      <svg {...common}>
        <path d="M5 11l7-7 7 7-7 7z" fill="#e2e8f0" stroke="#173a66" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M5 11h14l-7 7z" fill="#3b82f6" />
        <path d="M20 14c1.2 2 1.2 3.5 0 4.2-1.2-.7-1.2-2.2 0-4.2z" fill="#3b82f6" />
      </svg>
    );
  if (id === 'stamp')
    return (
      <svg {...common}>
        <path d="M12 2.5l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.3l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="#ec4899" stroke="#173a66" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  if (id === 'eraser')
    return (
      <svg {...common}>
        <path d="M3 15l9-9 7 7-6 6H7z" fill="#f9a8d4" stroke="#173a66" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 10l7 7" stroke="#173a66" strokeWidth="1.8" />
        <path d="M13 20h8" stroke="#173a66" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  return null;
}
function StampIcon({ kind, color }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      {kind === 'circle' && <circle cx="14" cy="14" r="10" fill={color} />}
      {kind === 'square' && <rect x="4" y="4" width="20" height="20" fill={color} />}
      {kind === 'triangle' && <path d="M14 3l11 19H3z" fill={color} />}
      {kind === 'star' && <path d="M14 2l3.3 7 7.6.9-5.6 5.2 1.5 7.6L14 19l-6.8 3.7 1.5-7.6-5.6-5.2 7.6-.9z" fill={color} />}
      {kind === 'heart' && <path d="M14 24C4 17 2 11 6 6.5c3-3 6.5-1.5 8 1.5 1.5-3 5-4.5 8-1.5 4 4.5 2 10.5-8 17.5z" fill={color} />}
    </svg>
  );
}
function MirrorIcon({ n }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="3" fill="#fff" stroke="#173a66" strokeWidth="1.6" />
      {n >= 2 && <path d="M12 3v18" stroke="#3b82f6" strokeWidth="1.6" strokeDasharray="2 2" />}
      {n === 4 && <path d="M3 12h18" stroke="#3b82f6" strokeWidth="1.6" strokeDasharray="2 2" />}
      <path d="M6 8q2-3 4 0" stroke="#ec4899" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {n >= 2 && <path d="M18 8q-2-3-4 0" stroke="#ec4899" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
      {n === 4 && <path d="M6 16q2 3 4 0M18 16q-2 3-4 0" stroke="#ec4899" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
    </svg>
  );
}

export default function ArtStudio({ playerId = 'guest' }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#3b82f6');
  const [size, setSize] = useState(10);
  const [stamp, setStamp] = useState('star');
  const [mirror, setMirror] = useState(1);
  const [undo, setUndo] = useState([]);
  const [gallery, setGallery] = useState(false);
  const [saved, setSaved] = useState(() => readArt(playerId).saved);
  const [toast, setToast] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const stroke = useRef(null);
  const hue = useRef(0);

  // Set up the canvas (white, or the drawing in progress).
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    ctxRef.current = ctx;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    const cur = readArt(playerId).current;
    if (cur) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, W, H);
      img.src = cur;
    }
    speak('Art Studio! Pick a color and draw with your finger.');
  }, [playerId]);
  // Back closes the gallery first.
  useEffect(() => {
    if (!gallery) return undefined;
    setBackHandler(() => {
      setGallery(false);
      return true;
    });
    return () => setBackHandler(null);
  }, [gallery]);

  function flash(t) {
    setToast(t);
    setTimeout(() => setToast(null), 1800);
  }
  function snapshot() {
    const ctx = ctxRef.current;
    setUndo((u) => [...u.slice(-9), ctx.getImageData(0, 0, W, H)]);
  }
  function autosave() {
    const art = readArt(playerId);
    writeArt(playerId, { ...art, current: canvasRef.current.toDataURL('image/jpeg', 0.75) });
  }
  // The points a mark is drawn at: the point and its mirror copies.
  const copies = (x, y) => {
    const pts = [[x, y]];
    if (mirror >= 2) pts.push([W - x, y]);
    if (mirror === 4) pts.push([x, H - y], [W - x, H - y]);
    return pts;
  };
  const toCanvas = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  function down(e) {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    const [x, y] = toCanvas(e);
    const ctx = ctxRef.current;
    snapshot();
    if (tool === 'fill') {
      playStickerPick();
      floodFill(ctx, Math.round(Math.max(0, Math.min(W - 1, x))), Math.round(Math.max(0, Math.min(H - 1, y))), color);
      autosave();
      return;
    }
    if (tool === 'stamp') {
      playStickerPick();
      ctx.fillStyle = color;
      for (const [px, py] of copies(x, y)) {
        stampPath(ctx, stamp, px, py, size * 3 + 18);
        ctx.fill();
      }
      autosave();
      return;
    }
    stroke.current = { x, y };
    line(x, y, x, y);
  }
  function line(x0, y0, x1, y1) {
    const ctx = ctxRef.current;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = tool === 'eraser' ? size * 2.2 : size;
    if (tool === 'rainbow') {
      hue.current = (hue.current + 9) % 360;
      ctx.strokeStyle = `hsl(${hue.current} 90% 55%)`;
    } else ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    const a = copies(x0, y0);
    const b = copies(x1, y1);
    a.forEach(([ax, ay], k) => {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(b[k][0], b[k][1]);
      ctx.stroke();
    });
  }
  function move(e) {
    if (!stroke.current) return;
    const [x, y] = toCanvas(e);
    line(stroke.current.x, stroke.current.y, x, y);
    stroke.current = { x, y };
  }
  function up() {
    if (!stroke.current) return;
    stroke.current = null;
    autosave();
  }
  function doUndo() {
    if (!undo.length) return;
    playStickerPick();
    ctxRef.current.putImageData(undo[undo.length - 1], 0, 0);
    setUndo(undo.slice(0, -1));
    autosave();
    speak('Undo');
  }
  function clearAll() {
    snapshot();
    const ctx = ctxRef.current;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    autosave();
    setConfirmClear(false);
    speak('A fresh page!');
  }
  function save() {
    const url = canvasRef.current.toDataURL('image/jpeg', 0.75);
    const art = readArt(playerId);
    const list = [{ url, at: Date.now() }, ...art.saved].slice(0, MAX_SAVED);
    if (!writeArt(playerId, { current: url, saved: list })) {
      flash('No room! Delete an old drawing first.');
      speak('No room. Delete an old drawing first.');
      return;
    }
    setSaved(list);
    playStickerStick();
    flash('Saved to your gallery!');
    speak('Saved to your gallery!');
  }
  function open(item) {
    snapshot();
    const img = new Image();
    img.onload = () => {
      ctxRef.current.drawImage(img, 0, 0, W, H);
      autosave();
    };
    img.src = item.url;
    setGallery(false);
    speak('Here is your drawing!');
  }
  function remove(at) {
    const art = readArt(playerId);
    const list = art.saved.filter((s) => s.at !== at);
    writeArt(playerId, { ...art, saved: list });
    setSaved(list);
  }
  const pick = (fn, say) => {
    playStickerPick();
    fn();
    if (say) speak(say);
  };

  return (
    <div className="game game-pz art-studio">
      <div className="art-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className={`art-canvas art-tool-${tool}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={up}
          aria-label="Drawing paper"
        />
        {mirror >= 2 && <span className="art-guide art-guide-v" aria-hidden="true" />}
        {mirror === 4 && <span className="art-guide art-guide-h" aria-hidden="true" />}
        {toast && <span className="art-toast">{toast}</span>}
      </div>
      <div className="art-row art-tools" role="group" aria-label="Tools">
        {TOOLS.map(([id, say]) => (
          <button key={id} type="button" className={`art-btn${tool === id ? ' art-on' : ''}`} aria-pressed={tool === id} aria-label={say} onClick={() => pick(() => setTool(id), say)}>
            <ToolIcon id={id} />
          </button>
        ))}
        <button
          type="button"
          className={`art-btn${mirror > 1 ? ' art-on' : ''}`}
          aria-label="Mirror"
          onClick={() => {
            const next = MIRRORS[(MIRRORS.findIndex((m) => m[0] === mirror) + 1) % MIRRORS.length];
            pick(() => setMirror(next[0]), next[1]);
          }}
        >
          <MirrorIcon n={mirror} />
        </button>
      </div>
      {tool === 'stamp' ? (
        <div className="art-row" role="group" aria-label="Stamps">
          {STAMPS.map((k) => (
            <button key={k} type="button" className={`art-btn art-small${stamp === k ? ' art-on' : ''}`} aria-label={k} onClick={() => pick(() => setStamp(k), k)}>
              <StampIcon kind={k} color={color} />
            </button>
          ))}
        </div>
      ) : null}
      <div className="art-colors" role="group" aria-label="Colors">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`art-color${color === c ? ' art-on' : ''}`}
            style={{ '--ac': c }}
            aria-label={`Color ${c}`}
            onClick={() =>
              pick(() => {
                setColor(c);
                if (tool === 'eraser') setTool('pen');
              })
            }
          />
        ))}
      </div>
      <div className="art-row art-bottom">
        {SIZES.map(([s, name]) => (
          <button key={s} type="button" className={`art-btn art-small${size === s ? ' art-on' : ''}`} aria-label={name} onClick={() => pick(() => setSize(s), name)}>
            <span className="art-dot" style={{ width: Math.max(6, s * 1.1), height: Math.max(6, s * 1.1), background: tool === 'eraser' ? '#94a3b8' : color }} />
          </button>
        ))}
        <span className="art-gap" />
        <button type="button" className="art-btn art-small" aria-label="Undo" disabled={!undo.length} onClick={doUndo}>
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 7H4V2M4 7a9 9 0 1 1-1 7" stroke="#173a66" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="art-btn art-small" aria-label="Start over" onClick={() => pick(() => setConfirmClear(true), 'Start over?')}>
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" stroke="#173a66" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="art-row art-actions">
        <button type="button" className="mi-sail art-save" onClick={save}>
          Save
        </button>
        <button type="button" className="bakery-btn" onClick={() => pick(() => setGallery(true), 'Your gallery')}>
          My gallery ({saved.length})
        </button>
      </div>
      {confirmClear && (
        <div className="pt-back pt-sheet-back" role="dialog" aria-modal="true" aria-label="Start over?">
          <div className="pt-up">
            <h2>Start over?</h2>
            <p>The paper will be all white again.</p>
            <div className="dm-actions">
              <button type="button" className="mi-sail" onClick={clearAll}>
                Yes, new page
              </button>
              <button type="button" className="bakery-btn" onClick={() => setConfirmClear(false)}>
                Keep drawing
              </button>
            </div>
          </div>
        </div>
      )}
      {gallery && (
        <div className="pt-back pt-sheet-back" role="dialog" aria-modal="true" aria-label="My gallery">
          <div className="pt-up art-gallery">
            <h2>My gallery</h2>
            {saved.length ? (
              <div className="art-grid">
                {saved.map((s) => (
                  <div key={s.at} className="art-thumb">
                    <button type="button" onClick={() => open(s)} aria-label="Open this drawing">
                      <img src={s.url} alt="" />
                    </button>
                    <button type="button" className="art-del" aria-label="Delete this drawing" onClick={() => remove(s.at)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>No saved drawings yet. Tap Save to keep one here!</p>
            )}
            <button type="button" className="bakery-btn" onClick={() => setGallery(false)}>
              Back to drawing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

// A measuring picture (ruler, sides, angle, coins, a clock...) that can be
// pinched right where it is: two fingers zoom in (up to 4x) around the
// spot between them, one finger drags it around while it's zoomed in, and
// a double-tap (or pinching back out) puts it back. A tap that wasn't a
// pinch or a drag still reaches the card (it reads the problem out). The
// page itself never zooms (index.html), so this does. A new problem starts
// unzoomed (the parent gives each problem its own key).
const MAX = 4;

export default function PinchZoom({ children }) {
  const box = useRef(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const moved = useRef(false);

  useEffect(() => {
    const el = box.current;
    let pinch = null;
    let pan = null;
    let lastTap = 0;
    const rect = () => el.getBoundingClientRect();
    const gap = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    // Keeps the zoomed picture covering its box (no empty edges).
    const clamp = (v) => {
      const r = rect();
      const minX = r.width * (1 - v.scale);
      const minY = r.height * (1 - v.scale);
      return { scale: v.scale, x: Math.min(0, Math.max(minX, v.x)), y: Math.min(0, Math.max(minY, v.y)) };
    };
    const down = (e) => {
      const v = viewRef.current;
      // A new touch: not a pinch or a drag (yet).
      if (e.touches.length === 1) moved.current = false;
      if (e.touches.length === 2) {
        const r = rect();
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
        pinch = { gap: gap(e.touches), cx, cy, ...v };
        pan = null;
        moved.current = true;
      } else if (e.touches.length === 1 && v.scale > 1) {
        pan = { tx: e.touches[0].clientX, ty: e.touches[0].clientY, ...v };
      }
    };
    const move = (e) => {
      if (pinch && e.touches.length === 2) {
        e.preventDefault();
        const scale = Math.min(MAX, Math.max(1, (pinch.scale * gap(e.touches)) / pinch.gap));
        const k = scale / pinch.scale;
        setView(clamp({ scale, x: pinch.cx - (pinch.cx - pinch.x) * k, y: pinch.cy - (pinch.cy - pinch.y) * k }));
      } else if (pan && e.touches.length === 1) {
        const dx = e.touches[0].clientX - pan.tx;
        const dy = e.touches[0].clientY - pan.ty;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true;
        if (!moved.current) return;
        e.preventDefault();
        setView(clamp({ scale: pan.scale, x: pan.x + dx, y: pan.y + dy }));
      }
    };
    const up = (e) => {
      if (e.touches.length < 2) pinch = null;
      if (e.touches.length === 0) {
        pan = null;
        if (viewRef.current.scale < 1.08) setView({ scale: 1, x: 0, y: 0 });
        // A double-tap puts it back.
        const now = Date.now();
        if (!moved.current && now - lastTap < 300 && viewRef.current.scale > 1) {
          setView({ scale: 1, x: 0, y: 0 });
          moved.current = true;
        }
        lastTap = now;
      }
    };
    el.addEventListener('touchstart', down, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', up);
    el.addEventListener('touchcancel', up);
    return () => {
      el.removeEventListener('touchstart', down);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', up);
      el.removeEventListener('touchcancel', up);
    };
  }, []);

  // A pinch or a drag isn't a tap on the card.
  function onClickCapture(e) {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  }

  const zoomed = view.scale > 1;
  return (
    <span
      ref={box}
      className={`pinch-zoom${zoomed ? ' pinch-zoom-on' : ''}`}
      onClickCapture={onClickCapture}
    >
      <span
        className="pinch-zoom-inner"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        {children}
      </span>
      {!zoomed && <span className="pinch-zoom-hint">Pinch to zoom</span>}
    </span>
  );
}

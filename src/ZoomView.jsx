import { useEffect, useRef, useState } from 'react';

// A measuring picture (a ruler, a shape's sides, an angle, a clock...)
// opened up big, to look closely: pinch or use + and − to zoom, drag to
// move around. The page itself never zooms (index.html), so this does.
const MIN = 1;
const MAX = 4;

export default function ZoomView({ onClose, children }) {
  const [zoom, setZoom] = useState(1.5);
  const box = useRef(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Pinch with two fingers. Listened to directly, not through React, so
  // the browser can be told not to handle the pinch itself.
  useEffect(() => {
    const el = box.current;
    let start = null;
    const gap = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const down = (e) => {
      if (e.touches.length === 2) start = { gap: gap(e.touches), zoom: zoomRef.current };
    };
    const move = (e) => {
      if (e.touches.length !== 2 || !start) return;
      e.preventDefault();
      setZoom(Math.min(MAX, Math.max(MIN, (start.zoom * gap(e.touches)) / start.gap)));
    };
    const up = (e) => {
      if (e.touches.length < 2) start = null;
    };
    el.addEventListener('touchstart', down, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', up);
    return () => {
      el.removeEventListener('touchstart', down);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', up);
    };
  }, []);

  const step = (by) => setZoom((z) => Math.min(MAX, Math.max(MIN, Math.round((z + by) * 2) / 2)));

  return (
    <div className="zoom-view" role="dialog" aria-label="Zoomed in picture">
      <div className="zoom-bar">
        <button className="zoom-btn" onClick={() => step(-0.5)} disabled={zoom <= MIN} aria-label="Zoom out">
          −
        </button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button className="zoom-btn" onClick={() => step(0.5)} disabled={zoom >= MAX} aria-label="Zoom in">
          +
        </button>
        <button className="zoom-close" onClick={onClose}>
          Done
        </button>
      </div>
      <div className="zoom-box" ref={box}>
        <div className="zoom-content" style={{ width: `${zoom * 100}%` }}>
          {children}
        </div>
      </div>
      <p className="zoom-tip">Pinch or tap + to zoom. Drag to look around.</p>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

// Drag and drop for little fingers (and a mouse). Start a drag with
// `start(item)` as an element's onPointerDown; drop places are any
// elements with `data-drop="<zone>"`. A press that doesn't move is a tap
// (`onTap(item)`); a drag calls `onDrop(item, zone)` (zone is null when
// it's let go anywhere else). `drag` ({ item, x, y, over }) is set while
// dragging, to draw the thing under the finger and light up the zone it's
// over. Draggable elements need `touch-action: none` so the page doesn't
// scroll instead.
const zoneAt = (x, y) => {
  const el = document.elementFromPoint(x, y);
  const z = el && el.closest('[data-drop]');
  return z ? z.dataset.drop : null;
};

export function useDragDrop({ onDrop, onTap }) {
  const [drag, setDrag] = useState(null);
  const st = useRef(null);
  const cb = useRef({ onDrop, onTap });
  cb.current = { onDrop, onTap };
  useEffect(() => {
    function move(e) {
      const s = st.current;
      if (!s) return;
      if (!s.moving && Math.hypot(e.clientX - s.x0, e.clientY - s.y0) > 8) s.moving = true;
      if (s.moving) {
        e.preventDefault();
        setDrag({ item: s.item, x: e.clientX, y: e.clientY, over: zoneAt(e.clientX, e.clientY) });
      }
    }
    function up(e) {
      const s = st.current;
      if (!s) return;
      st.current = null;
      setDrag(null);
      if (s.moving) cb.current.onDrop?.(s.item, zoneAt(e.clientX, e.clientY));
      else if (e.type === 'pointerup') cb.current.onTap?.(s.item);
    }
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);
  const start = (item) => (e) => {
    if (e.button > 0) return;
    st.current = { item, x0: e.clientX, y0: e.clientY, moving: false };
  };
  return { drag, start };
}

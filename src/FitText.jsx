import { useLayoutEffect, useRef } from 'react';

// Text that grows to fill its box: the biggest font size (between `min`
// and `max` px) at which it still fits, worked out again whenever the box
// changes size. For word problems and long prompts on the problem card,
// so a short sentence is big and a long one still fits.
export default function FitText({ min = 18, max = 54, className = '', children }) {
  const box = useRef(null);
  const text = useRef(null);

  useLayoutEffect(() => {
    const b = box.current;
    const t = text.current;
    if (!b || !t) return undefined;
    const fit = () => {
      const w = b.clientWidth;
      // A card that doesn't fill the screen has no set height: aim for a
      // comfortable block instead.
      const h = b.clientHeight > 80 ? b.clientHeight : 260;
      let lo = min;
      let hi = max;
      while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        t.style.fontSize = `${mid}px`;
        if (t.scrollHeight <= h && t.scrollWidth <= w) lo = mid;
        else hi = mid;
      }
      t.style.fontSize = `${Math.floor(lo)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    return () => ro.disconnect();
  }, [min, max, children]);

  return (
    <span ref={box} className={`fit-box ${className}`}>
      <span ref={text} className="fit-text">
        {children}
      </span>
    </span>
  );
}

// A word problem's text with its numbers in bubbles and its question (the
// last sentence, "How many ...?") on a line of its own.
export function WordProblem({ text }) {
  const str = String(text || '');
  const at = str.lastIndexOf('. ');
  const story = at >= 0 && str.trim().endsWith('?') ? str.slice(0, at + 1) : '';
  const question = story ? str.slice(at + 2) : str;
  const nums = (s) =>
    s.split(/(\d[\d,.]*)/).map((part, i) =>
      /^\d/.test(part) ? (
        <b key={i} className="num-chip">
          {part}
        </b>
      ) : (
        part
      ),
    );
  return (
    <>
      {story && <span className="wp-story">{nums(story)}</span>}
      <span className="wp-question">{nums(question)}</span>
    </>
  );
}

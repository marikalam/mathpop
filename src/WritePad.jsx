import { useEffect, useRef, useState } from 'react';
import { loadDigitModel } from './digitModel.js';
import { recognizeNumber } from './handwriting.js';

const CANVAS_W = 560;
const CANVAS_H = 170;

export default function WritePad({ onSubmit }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [modelReady, setModelReady] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const [recognized, setRecognized] = useState(null);
  const [recognizing, setRecognizing] = useState(false);

  useEffect(() => {
    loadDigitModel().then(() => setModelReady(true));
  }, []);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = e.touches && e.touches[0] ? e.touches[0] : e;
    return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
  }

  function startDraw(e) {
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPos(e);
    setRecognized(null);
  }

  function draw(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    const last = lastPointRef.current;
    ctx.strokeStyle = '#232842';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPointRef.current = pos;
    setHasInk(true);
  }

  function endDraw(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    drawingRef.current = false;
    if (!modelReady) return;
    setRecognizing(true);
    requestAnimationFrame(() => {
      const result = recognizeNumber(canvasRef.current);
      setRecognized(result);
      setRecognizing(false);
    });
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    setRecognized(null);
  }

  function submit() {
    if (!recognized || recognized.text === '') return;
    onSubmit(parseInt(recognized.text, 10));
  }

  return (
    <div className="write-pad">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="write-canvas"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="write-pad-status">
        {!modelReady ? (
          <span className="write-pad-hint">Loading handwriting recognizer…</span>
        ) : recognizing ? (
          <span className="write-pad-hint">Reading…</span>
        ) : !hasInk ? (
          <span className="write-pad-hint">Write your answer above</span>
        ) : recognized && recognized.text ? (
          <span className="write-pad-preview">
            I read: <strong>{recognized.text}</strong>
          </span>
        ) : (
          <span className="write-pad-hint">Hmm, I can't read that — try again</span>
        )}
      </div>
      <div className="write-pad-actions">
        <button className="pill-btn-secondary" onClick={clear} disabled={!hasInk}>
          Clear
        </button>
        <button className="pill-btn-submit" onClick={submit} disabled={!recognized || !recognized.text}>
          Submit
        </button>
      </div>
    </div>
  );
}

import { setSgSettings, useSgSettings } from './sgMode.js';

// Players & grades: the Singapore Math Mode settings (sgMode.js).
const THINK = [
  ['auto', 'Automatic', 'wait for Pre-K to 1st'],
  ['wait', 'Wait for me', 'game pauses'],
  ['slow', 'Slow', 'about half speed'],
  ['normal', 'Normal', 'arcade speed'],
];
const MODELS = [
  ['tenFrames', 'Ten frames and counters'],
  ['bonds', 'Number bonds'],
  ['bars', 'Bar models for story problems'],
  ['disks', 'Place value disks'],
];
export default function SgModeCard() {
  const s = useSgSettings();
  return (
    <section className="sgm-card" aria-labelledby="sgm-title">
      <div className="sgm-head">
        <h3 id="sgm-title">Singapore Math Mode</h3>
        <p>Games pause to think, and show each idea with objects, then a picture, then numbers.</p>
      </div>
      <h4>Think time</h4>
      <div className="sgm-think">
        {THINK.map(([id, name, sub]) => (
          <button key={id} type="button" className={`sgm-opt${s.think === id ? ' sgm-on' : ''}`} aria-pressed={s.think === id} onClick={() => setSgSettings({ think: id })}>
            <b>{name}</b>
            <small>{sub}</small>
          </button>
        ))}
      </div>
      <p className="sgm-note">With Wait for me, action games stop at each new question until your child taps I'm ready, and timed games (Mad Minute, Pop the Bubbles) have no clock.</p>
      <h4>Show the models</h4>
      {MODELS.map(([id, name]) => (
        <label key={id} className="sgm-check">
          <span>{name}</span>
          <input type="checkbox" checked={s[id]} onChange={(e) => setSgSettings({ [id]: e.target.checked })} />
        </label>
      ))}
      <h4>Hints</h4>
      <p className="sgm-steps">
        <span>1 Objects</span> → <span>2 Picture</span> → <span>3 Numbers</span>
      </p>
      <label className="sgm-check">
        <span>Show a hint after a miss</span>
        <input type="checkbox" checked={s.hintAfterMiss} onChange={(e) => setSgSettings({ hintAfterMiss: e.target.checked })} />
      </label>
    </section>
  );
}

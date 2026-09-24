// Visual "make a ten" scaffold for addition, using base-ten blocks
// (a bundled group of ten unit squares, plus loose ones) so it stays
// legible from single digits up through two-digit numbers, instead of
// counting raw dots one by one.

function TenBlock({ color }) {
  const cells = Array.from({ length: 10 }, (_, i) => i);
  return (
    <span className="ten-block" style={{ borderColor: color }}>
      {cells.map((i) => (
        <span key={i} className="unit-square" style={{ background: color }} />
      ))}
    </span>
  );
}

function OneSquare({ color, faded }) {
  return <span className={`unit-square unit-square-loose${faded ? ' unit-square-faded' : ''}`} style={{ background: color }} />;
}

function BlockGroup({ n, color, fadedOnes = 0 }) {
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return (
    <div className="block-group">
      {Array.from({ length: tens }, (_, i) => (
        <TenBlock key={`t${i}`} color={color} />
      ))}
      {Array.from({ length: ones }, (_, i) => (
        <OneSquare key={`o${i}`} color={color} faded={i >= ones - fadedOnes} />
      ))}
    </div>
  );
}

function HelpPair({ a, b, fadedOnes = 0 }) {
  if (b === 0) {
    return (
      <div className="help-row">
        <BlockGroup n={a} color="#3B6FEF" />
      </div>
    );
  }
  return (
    <div className="help-row">
      <BlockGroup n={a} color="#3B6FEF" />
      <span className="help-plus">+</span>
      <BlockGroup n={b} color="#2FAE6B" fadedOnes={fadedOnes} />
    </div>
  );
}

export function getAdditionHelp(a, b) {
  const onesA = a % 10;
  const onesB = b % 10;
  if (onesA === 0 || onesB === 0 || onesA + onesB < 10) {
    return { crossesTen: false };
  }
  const complement = 10 - onesA;
  return { crossesTen: true, complement, newA: a + complement, newB: b - complement };
}

export default function AdditionHelp({ a, b, onClose }) {
  const help = getAdditionHelp(a, b);

  return (
    <div className="addition-help">
      <h2 className="screen-title">Let's break it down!</h2>

      {help.crossesTen ? (
        <>
          <p className="screen-sub help-step">
            Move <strong>{help.complement}</strong> from {b} to make a ten with {a}
          </p>
          <HelpPair a={a} b={b} fadedOnes={help.complement} />
          <div className="help-arrow">↓</div>
          <p className="screen-sub help-step">Now it's an easier problem!</p>
          <HelpPair a={help.newA} b={help.newB} />
          <div className="help-equation">
            {a} + {b} = {help.newA}
            {help.newB !== 0 ? ` + ${help.newB}` : ''} = ?
          </div>
        </>
      ) : (
        <>
          <p className="screen-sub help-step">Put the groups together and count them all!</p>
          <HelpPair a={a} b={b} />
          <div className="help-equation">
            {a} + {b} = ?
          </div>
        </>
      )}

      <button className="pill-btn-primary pill-btn-full" onClick={onClose}>
        Got it, let's try! →
      </button>
    </div>
  );
}

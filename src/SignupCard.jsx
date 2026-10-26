import LogoMark from './LogoMark.jsx';

// When MathPop opens without a family account: asks a grown-up to sign up
// with email (past the grown-ups check, App.jsx), so players, grades and
// stickers are saved and synced. "Not now" lets kids play straight away
// as a guest; it asks again a few days later (App.jsx).
export default function SignupCard({ onSignUp, onSignIn, onLater }) {
  return (
    <div className="handoff-backdrop" role="dialog" aria-modal="true" aria-labelledby="signup-title">
      <div className="handoff-card signup-card">
        <div className="welcome-logo">
          <LogoMark playing={1} />
        </div>
        <h2 id="signup-title" className="handoff-title">
          Save your kids’ progress
        </h2>
        <p className="handoff-text">A free family account, for grown-ups:</p>
        <ul className="signup-perks">
          <li>
            <span aria-hidden="true">📱</span> Players, grades and stickers on every iPhone and iPad
          </li>
          <li>
            <span aria-hidden="true">🔒</span> Nothing lost if the app is deleted or the phone changes
          </li>
          <li>
            <span aria-hidden="true">📈</span> Each child’s week and progress report
          </li>
        </ul>
        <button type="button" className="pill-btn-primary pill-btn-full" onClick={onSignUp}>
          Sign up with email
        </button>
        <button type="button" className="signup-signin" onClick={onSignIn}>
          I have an account: sign in
        </button>
        <button type="button" className="handoff-stay" onClick={onLater}>
          Not now, just play
        </button>
      </div>
    </div>
  );
}

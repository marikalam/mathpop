import LogoMark from './LogoMark.jsx';
import Icon from './Icon.jsx';

// When MathPop opens without a family account: asks a grown-up to sign up
// with email (past the grown-ups check, App.jsx), so players, grades and
// stickers are saved and synced. "Not now" lets kids play straight away
// as a guest; it asks again a few days later (App.jsx).
//
// A new device gets a 7-day free trial on its own (plus.js). Once that
// week is over without Plus, the card offers 7 more free days for making
// a family account instead: a grown-up can also subscribe without an
// account, and "just play" is today's one free round (it asks again the
// next day).
export default function SignupCard({ trial = false, onSignUp, onSignIn, onSubscribe, onLater }) {
  return (
    <div className="handoff-backdrop" role="dialog" aria-modal="true" aria-labelledby="signup-title">
      <div className="handoff-card signup-card">
        <div className="welcome-logo">
          <LogoMark playing={1} />
        </div>
        <h2 id="signup-title" className="handoff-title">
          {trial ? 'Get 7 more free days' : 'Save your kids’ progress'}
        </h2>
        <p className="handoff-text">
          {trial ? 'Make a free family account (for grown-ups). No payment details needed.' : 'A free family account, for grown-ups:'}
        </p>
        <ul className="signup-perks">
          {trial && (
            <li>
              <Icon name="star" /> Every game and topic, as many rounds as they like
            </li>
          )}
          <li>
            <Icon name="phone" /> Players, grades and stickers on every iPhone and iPad
          </li>
          <li>
            <Icon name="lock" /> Nothing lost if the app is deleted or the phone changes
          </li>
          <li>
            <Icon name="growth" /> Each child’s week and progress report
          </li>
        </ul>
        <button type="button" className="pill-btn-primary pill-btn-full" onClick={onSignUp}>
          Sign up with email
        </button>
        <button type="button" className="signup-signin" onClick={onSignIn}>
          I have an account: sign in
        </button>
        {trial && (
          <button type="button" className="signup-signin" onClick={onSubscribe}>
            Subscribe without an account
          </button>
        )}
        <button type="button" className="handoff-stay" onClick={onLater}>
          {trial ? 'Just play today’s free round' : 'Not now, just play'}
        </button>
      </div>
    </div>
  );
}

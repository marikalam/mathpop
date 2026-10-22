import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';
import { buyPlus, manageSubscription, plusProducts, restorePlus } from './plus.js';

// MathPop Plus, for grown-ups (behind the grown-ups check): what it adds,
// and the subscription (iPhone app). Founding families, and everyone
// before Plus starts, already have it, free.
const IS_NATIVE = Capacitor.isNativePlatform();
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://marikalam.github.io/apps/mathpop/privacy.html';

const FEATURES = [
  ['📊', 'Full progress report', 'Every topic with how often they get it right, the tricky ones, four weeks of practice, and the mistakes still to fix.'],
  ['🎯', 'Assign practice', 'Pick topics for each child: they show up first in their Today’s practice.'],
  ['👨‍👩‍👧', 'One family plan', 'Every child, on every device signed in to your family account.'],
  ['💛', 'Keeps MathPop growing', 'No ads, ever. Plus helps a mom keep building it.'],
];

function periodName(product) {
  return /year/.test(product.identifier) ? 'year' : 'month';
}

export default function PlusScreen({ status, user, onStatus, onSignIn, openOutside }) {
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!status.plus || status.why === 'paid') plusProducts().then(setProducts);
  }, [status.plus, status.why]);

  async function buy(id) {
    setBusy(true);
    setMessage('');
    try {
      onStatus(await buyPlus(id, user));
    } catch (err) {
      if (!/cancel/i.test(String(err?.message || err))) setMessage('The purchase didn’t go through. Please try again.');
    }
    setBusy(false);
  }

  async function restore() {
    setBusy(true);
    const next = await restorePlus(user);
    onStatus(next);
    setMessage(next.plus ? 'Plus is back on.' : 'No Plus subscription found for this Apple ID.');
    setBusy(false);
  }

  return (
    <div className="plus-screen">
      <div className="plus-hero">
        <span className="plus-hero-badge">✨ Plus</span>
        {status.why === 'founder' && (
          <p className="plus-hero-text">You’re a founding family 💛 Plus is free for you, for good. Thank you for being here early!</p>
        )}
        {status.why === 'early' && (
          <p className="plus-hero-text">Plus is free for everyone right now, and families using MathPop before it starts keep it free for good.</p>
        )}
        {status.why === 'paid' && (
          <p className="plus-hero-text">
            Plus is on{status.paidUntil ? ` until ${new Date(status.paidUntil).toLocaleDateString()}` : ''}. Thank you for supporting MathPop!
          </p>
        )}
        {!status.plus && <p className="plus-hero-text">The grown-ups’ extras for MathPop.</p>}
      </div>

      <ul className="plus-features">
        {FEATURES.map(([icon, title, text]) => (
          <li key={title}>
            <span className="plus-feature-icon" aria-hidden="true">
              {icon}
            </span>
            <span>
              <strong>{title}</strong>
              {text}
            </span>
          </li>
        ))}
      </ul>

      {status.why === 'paid' && IS_NATIVE && (
        <button className="pill-btn-secondary pill-btn-full" onClick={manageSubscription}>
          Manage subscription
        </button>
      )}

      {!status.plus && !IS_NATIVE && (
        <p className="plus-note">Subscribe in the MathPop iPhone app, then sign in here with the same family account.</p>
      )}

      {!status.plus && IS_NATIVE && (
        <>
          {!user && (
            <div className="plus-signin">
              <p>Sign in to your family account first, so Plus works on all your devices and in PitchPop.</p>
              <button className="pill-btn-secondary" onClick={onSignIn}>
                Sign in or create account
              </button>
            </div>
          )}
          <div className="plus-buy">
            {products.length === 0 && <p className="plus-note">Loading prices…</p>}
            {products.map((p) => (
              <button key={p.identifier} className="plus-buy-btn" disabled={busy} onClick={() => buy(p.identifier)}>
                <strong>
                  {p.priceString} / {periodName(p)}
                </strong>
                <span>{periodName(p) === 'year' ? 'Best value · 7 days free, then yearly' : '7 days free, then monthly'}</span>
              </button>
            ))}
          </div>
          <button className="back-link back-link-center" disabled={busy} onClick={restore}>
            Restore purchases
          </button>
          <p className="plus-legal">
            Payment is charged to your Apple ID when you confirm, after any free trial. The subscription renews automatically unless
            it’s cancelled at least 24 hours before the end of the period; manage or cancel it in your App Store account settings.{' '}
            <button className="plus-link" onClick={() => openOutside(TERMS_URL)}>
              Terms of Use
            </button>{' '}
            ·{' '}
            <button className="plus-link" onClick={() => openOutside(PRIVACY_URL)}>
              Privacy Policy
            </button>
          </p>
        </>
      )}
      {message && <p className="plus-note">{message}</p>}
    </div>
  );
}

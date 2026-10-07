import { useEffect, useState } from 'react';
import { deleteAccount, requestPasswordReset, signIn, signOut, signUp, updatePassword } from './cloud.js';
import Avatar from './Avatar.jsx';
import { GRADES } from './grades.js';

// A password input with an eye button that shows or hides what's typed.
function PasswordField({ label, value, onChange, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="password-wrap">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minLength={6}
          required
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </span>
    </label>
  );
}

const PASSWORDS_DIFFER = 'The two passwords don’t match. Please type them again.';

// One player on the Players screen: name, Remove, how they're doing, and
// the grade they play at (Singapore school year in brackets).
export function PlayerSettingsCard({ profile, onUpdate, onRemove, canRemove, stats }) {
  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <Avatar profile={profile.id} size={30} />
        <input
          className="profile-name-input"
          value={profile.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          aria-label={`${profile.name} name`}
        />
        <button className="remove-player-btn" type="button" onClick={onRemove} disabled={!canRemove}>
          Remove
        </button>
      </div>
      <p className="player-history">
        {stats?.total
          ? `${stats.total} ${stats.total === 1 ? 'problem' : 'problems'} solved · ${Math.round((stats.correct / stats.total) * 100)}% right`
          : 'Hasn’t played yet'}
      </p>
      <p className="settings-help">Grade</p>
      <div className="grade-settings-grid" role="radiogroup" aria-label={`${profile.name} grade`}>
        {GRADES.map((g) => (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={profile.grade === g.id}
            className={`grade-setting${profile.grade === g.id ? ' grade-setting-active' : ''}`}
            style={{ '--grade-color': g.color }}
            onClick={() => onUpdate({ grade: g.id })}
          >
            <span className="grade-setting-name">{g.short}</span>
            <span className="grade-setting-sg">{g.sg}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function AddPlayerForm({ onAdd }) {
  const [name, setName] = useState('');
  return (
    <form
      className="add-profile"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(name);
        setName('');
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New player name"
        aria-label="New player name"
      />
      <button className="pill-btn-primary" type="submit">
        Add player
      </button>
    </form>
  );
}

function initialFor(user) {
  return (user?.email || '?').trim().charAt(0).toUpperCase();
}

function memberSince(user) {
  if (!user?.created_at) return null;
  const created = new Date(user.created_at);
  if (Number.isNaN(created.getTime())) return null;
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfDay(new Date()) - startOfDay(created)) / 86400000);
  return {
    date: created.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
    ago: days <= 0 ? 'Joined today' : days === 1 ? 'Joined yesterday' : `${days.toLocaleString()} days with MathPop`,
  };
}

export function AccountButton({ user, onClick }) {
  if (user) {
    return (
      <button className="account-btn account-btn-signed-in" onClick={onClick} aria-label={`Account: ${user.email}`}>
        {initialFor(user)}
      </button>
    );
  }
  return (
    <button className="account-btn account-btn-signed-out" onClick={onClick} aria-label="Sign in or create account">
      <span className="account-btn-line1">Sign in</span>
      <span className="account-btn-line2">or create account</span>
    </button>
  );
}

// Whether the phone has an internet connection right now.
function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

export function SyncStatus({ user, onOpenAccount }) {
  const online = useOnline();
  if (user && !online) {
    return (
      <div className="sync-status sync-status-offline">
        <span className="sync-dot sync-dot-offline" aria-hidden="true" />
        <span>
          Offline: changes are saved on this phone and sync to <strong>{user.email}</strong> when you’re back online
        </span>
      </div>
    );
  }
  if (user) {
    return (
      <div className="sync-status sync-status-on">
        <span className="sync-dot" aria-hidden="true" />
        <span>
          Synced to <strong>{user.email}</strong>
        </span>
      </div>
    );
  }
  return (
    <button className="sync-status sync-status-off" onClick={onOpenAccount}>
      <span>Saved on this device only</span>
      <span className="sync-link">Sign in to sync →</span>
    </button>
  );
}

export function AccountScreen({ user, playerCount, onSignedIn, onAccountDeleted, onOpenPlayers, onDone, recoveryMode, onPasswordUpdated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [mode, setMode] = useState('sign-in');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'sign-up' && password !== confirmPassword) {
      setError(PASSWORDS_DIFFER);
      return;
    }
    setBusy(true);
    try {
      if (mode === 'reset-request') {
        await requestPasswordReset(email);
        setNotice(`We sent a password reset link to ${email}. Open it on this device to set a new password.`);
        return;
      }
      const signedIn = mode === 'sign-in' ? await signIn(email, password) : await signUp(email, password);
      if (signedIn) {
        await onSignedIn(signedIn);
        setPassword('');
        setConfirmPassword('');
      } else {
        setNotice(
          mode === 'sign-up'
            ? `Check ${email} for a link to confirm your account, then sign in here. Already have an account? Just sign in.`
            : `We sent a confirmation link to ${email}. Open it, then sign in here.`,
        );
        setMode('sign-in');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmNewPassword) {
      setError(PASSWORDS_DIFFER);
      return;
    }
    setBusy(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      onPasswordUpdated();
      setNotice('Your password has been updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    onSignedIn(null);
  }

  async function handleDeleteAccount() {
    if (
      !window.confirm(`Delete the account for ${user.email}? All its players in MathPop and PitchPop will be deleted.`) ||
      !window.confirm('Are you really sure? This can’t be undone.')
    ) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await deleteAccount();
      onAccountDeleted();
      setNotice('Your account and its players have been deleted.');
    } catch (err) {
      setError(`Couldn’t delete your account: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  if (recoveryMode) {
    return (
      <div className="account-screen">
        <div className="auth-card">
          <h2 className="auth-title">Choose a new password</h2>
          <p className="auth-sub">Enter a new password for {user?.email || 'your account'}.</p>
          <form className="auth-form" onSubmit={handleResetPassword}>
            <PasswordField
              label="New password"
              autoComplete="new-password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="At least 6 characters"
            />
            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={setConfirmNewPassword}
              placeholder="Type it again"
            />
            {error && <div className="auth-error">{error}</div>}
            {notice && <div className="auth-notice">{notice}</div>}
            <button className="pill-btn-primary pill-btn-full" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : 'Save new password'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (user) {
    const since = memberSince(user);
    return (
      <div className="account-screen">
        <div className="account-profile">
          <div className="account-avatar">{initialFor(user)}</div>
          <div className="account-email">{user.email}</div>
          <div className="account-badge">
            <span className="sync-dot" aria-hidden="true" />
            Signed in
          </div>
        </div>

        {since && (
          <div className="account-section">
            <div className="account-row">
              <span className="account-row-label">Member since</span>
              <span className="account-row-value">{since.date}</span>
            </div>
            <p className="account-row-help">{since.ago}</p>
          </div>
        )}

        <div className="account-section">
          <div className="account-row">
            <span className="account-row-label">Sync</span>
            <span className="account-row-value">On</span>
          </div>
          <p className="account-row-help">Players and their grades are saved to your account and load on any device you sign in on. It’s the same account as PitchPop.</p>
        </div>

        <div className="account-section">
          <button className="account-row account-row-button" onClick={onOpenPlayers}>
            <span className="account-row-label">Players &amp; grades</span>
            <span className="account-row-value">
              {playerCount} {playerCount === 1 ? 'player' : 'players'} ›
            </span>
          </button>
        </div>

        <button className="account-signout" onClick={handleSignOut}>
          Sign out
        </button>
        {error && <div className="auth-error">{error}</div>}
        <button className="account-delete" onClick={handleDeleteAccount} disabled={busy}>
          {busy ? 'Deleting…' : 'Delete account'}
        </button>
      </div>
    );
  }

  if (mode === 'reset-request') {
    return (
      <div className="account-screen">
        <div className="auth-card">
          <h2 className="auth-title">Reset your password</h2>
          <p className="auth-sub">Enter your email and we'll send you a link to set a new password.</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            {error && <div className="auth-error">{error}</div>}
            {notice && <div className="auth-notice">{notice}</div>}
            <button className="pill-btn-primary pill-btn-full" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : 'Send reset link'}
            </button>
          </form>
        </div>

        <button
          className="back-link back-link-center"
          onClick={() => {
            setMode('sign-in');
            setError('');
            setNotice('');
          }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="account-screen">
      <div className="auth-card">
        <h2 className="auth-title">{mode === 'sign-in' ? 'Sign in to MathPop' : 'Create your family account'}</h2>
        <p className="auth-sub">Keep your players and their grades in sync across all your devices.</p>

        <div className="auth-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={mode === 'sign-in'}
            className={`auth-tab${mode === 'sign-in' ? ' auth-tab-active' : ''}`}
            onClick={() => {
              setMode('sign-in');
              setError('');
            }}
          >
            Sign in
          </button>
          <button
            role="tab"
            aria-selected={mode === 'sign-up'}
            className={`auth-tab${mode === 'sign-up' ? ' auth-tab-active' : ''}`}
            onClick={() => {
              setMode('sign-up');
              setError('');
            }}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <PasswordField
            label="Password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={setPassword}
            placeholder={mode === 'sign-in' ? 'Your password' : 'At least 6 characters'}
          />
          {mode === 'sign-up' && (
            <PasswordField
              label="Confirm password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Type it again"
            />
          )}
          {mode === 'sign-in' && (
            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => {
                setMode('reset-request');
                setError('');
                setNotice('');
              }}
            >
              Forgot password?
            </button>
          )}
          {error && <div className="auth-error">{error}</div>}
          {notice && <div className="auth-notice">{notice}</div>}
          <button className="pill-btn-primary pill-btn-full" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>

      <button className="back-link back-link-center" onClick={onDone}>
        Continue as guest
      </button>
    </div>
  );
}

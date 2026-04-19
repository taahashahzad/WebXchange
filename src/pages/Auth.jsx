import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Input } from '../components/UI';
import { signIn, signUp, signInWithGoogle, resetPassword } from '../services/authService';
import { supabase } from '../lib/supabaseClient';
import styles from './Auth.module.css';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const from     = location.state?.from?.pathname || '/dashboard';

  const [tab, setTab] = useState('login');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErr,  setLoginErr]  = useState('');
  const [loginBusy, setLoginBusy] = useState(false);

  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', agree: false });
  const [signupDone, setSignupDone] = useState(false); // controls the "check email" screen
  const [signupErr,  setSignupErr]  = useState('');
  const [signupBusy, setSignupBusy] = useState(false);
  const [resetSent,  setResetSent]  = useState(false);

  // When Supabase redirects back after email confirmation,
  // it fires an auth state change with event = 'SIGNED_IN'.
  // We catch that here and navigate to dashboard automatically.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard', { replace: true });
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginErr(''); setLoginBusy(true);
    try {
      await signIn(loginForm);
      navigate(from, { replace: true });
    } catch (err) {
      setLoginErr(err.message);
    } finally { setLoginBusy(false); }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setSignupErr('');
    if (!signupForm.agree) { setSignupErr('Please agree to the Terms & Privacy.'); return; }
    if (signupForm.password.length < 8) { setSignupErr('Password must be at least 8 characters.'); return; }
    setSignupBusy(true);
    try {
      await signUp({
        email:    signupForm.email,
        password: signupForm.password,
        fullName: signupForm.name,
      });
      // Stay on signup tab — show "check your email" screen instead of redirecting
      setSignupDone(true);
    } catch (err) {
      setSignupErr(err.message);
    } finally { setSignupBusy(false); }
  }

  async function handleGoogle() {
    try { await signInWithGoogle(); } catch (err) { setLoginErr(err.message); }
  }

  async function handleReset() {
    if (!loginForm.email) { setLoginErr('Enter your email above first.'); return; }
    try { await resetPassword(loginForm.email); setResetSent(true); }
    catch (err) { setLoginErr(err.message); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.tabRow}>
        <button
          className={`${styles.tab} ${tab === 'login' ? styles.activeTab : ''}`}
          onClick={() => { setTab('login'); setSignupDone(false); }}
        >
          Login
        </button>
        <button
          className={`${styles.tab} ${tab === 'signup' ? styles.activeTab : ''}`}
          onClick={() => { setTab('signup'); setSignupDone(false); }}
        >
          Sign Up
        </button>
      </div>

      {/* ── Login tab ── */}
      {tab === 'login' && (
        <Card>
          <h2>Welcome Back</h2>
          <p className={styles.muted}>Login to continue earning and managing your campaigns.</p>

          <form onSubmit={handleLogin} className={styles.form}>
            <Input
              label="Email" type="email" placeholder="you@example.com"
              value={loginForm.email}
              onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Password" type="password" placeholder="••••••••"
              value={loginForm.password}
              onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            {loginErr  && <div className={styles.errMsg}>⚠️ {loginErr}</div>}
            {resetSent && <div className={styles.successMsg}>📧 Password reset email sent.</div>}
            <div className={styles.loginRow}>
              <button type="button" className={styles.forgotLink} onClick={handleReset}>
                Forgot password?
              </button>
              <Button variant="primary" type="submit" disabled={loginBusy}>
                {loginBusy ? 'Logging in…' : 'Login'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Signup tab — form ── */}
      {tab === 'signup' && !signupDone && (
        <Card>
          <h2>Create Account</h2>
          <p className={styles.muted}>Start earning traffic for your website in minutes.</p>
          <form onSubmit={handleSignup} className={styles.form}>
            <Input
              label="Full Name" placeholder="Your Name"
              value={signupForm.name}
              onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Email" type="email" placeholder="you@example.com"
              value={signupForm.email}
              onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Password" type="password" placeholder="At least 8 characters"
              value={signupForm.password}
              onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={signupForm.agree}
                onChange={e => setSignupForm(f => ({ ...f, agree: e.target.checked }))}
              />
              <span className={styles.muted}>I agree to the Terms &amp; Privacy Policy</span>
            </label>
            {signupErr && <div className={styles.errMsg}>⚠️ {signupErr}</div>}
            <div className={styles.signupAction}>
              <Button variant="primary" type="submit" disabled={signupBusy}>
                {signupBusy ? 'Creating account…' : 'Create Account'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Signup tab — check email screen ── */}
      {tab === 'signup' && signupDone && (
        <Card>
          <div className={styles.confirmScreen}>
            <div className={styles.confirmIcon}>📧</div>
            <h2>Check your email</h2>
            <p className={styles.muted}>
              We sent a confirmation link to <strong>{signupForm.email}</strong>.
              Click the link in the email to activate your account — you'll be
              logged in automatically.
            </p>
            <div className={styles.confirmTips}>
              <p>Didn't get it? Check your spam folder.</p>
              <p>
                Wrong email?{' '}
                <button
                  className={styles.forgotLink}
                  onClick={() => setSignupDone(false)}
                >
                  Go back and try again
                </button>
              </p>
            </div>
            <div style={{ marginTop: 20 }}>
              <Button
                variant="primary"
                style={{ width: '100%' }}
                onClick={() => { setTab('login'); setSignupDone(false); }}
              >
                Already confirmed? Log in
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
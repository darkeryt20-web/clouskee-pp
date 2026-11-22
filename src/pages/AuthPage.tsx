import {FormEvent, useEffect, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {
  checkUsernameAvailability,
  sanitizeHandle,
} from '../utils/usernameRegistry';

interface AuthPageProps {
  mode: 'login' | 'signup';
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-3.5 h-3.5 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.25-.96 2.31-2.05 3.02l3.31 2.57c1.93-1.78 3.04-4.4 3.04-7.49 0-.72-.06-1.41-.19-2.08H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.75 0 5.06-.91 6.75-2.46l-3.31-2.57c-.91.61-2.08.98-3.44.98-2.64 0-4.88-1.78-5.68-4.18H2.9v2.64A10 10 0 0 0 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.32 13.77A5.99 5.99 0 0 1 6 12c0-.61.11-1.21.32-1.77V7.59H2.9A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.41l3.24-2.64z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.05c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 3.02 14.74 2 12 2a10 10 0 0 0-9.1 5.59l3.42 2.64c.8-2.4 3.04-4.18 5.68-4.18z"
      />
    </svg>
  );
}

export function AuthPage({mode}: AuthPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleParam = searchParams.get('handle') ?? '';
  const verifiedParam = searchParams.get('verified') === '1';
  const planParam = searchParams.get('plan') ?? '';
  const addonParam = searchParams.get('addon') ?? '';

  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendResetEmail,
    startDiscordOAuth,
  } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Signup username-first state
  const [signupStep, setSignupStep] = useState<'username' | 'details'>(
    'username',
  );
  const [username, setUsername] = useState(sanitizeHandle(handleParam));
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [signupSubmitting, setSignupSubmitting] = useState(false);

  useEffect(() => {
    setLoginError('');
    setForgotMessage('');
    setUsernameError('');
    setDetailsError('');

    if (mode === 'signup') {
      const cleaned = sanitizeHandle(handleParam);
      setUsername(cleaned);
      if (cleaned && verifiedParam) {
        setSignupStep('details');
      } else if (cleaned) {
        setCheckingUsername(true);
        checkUsernameAvailability(cleaned)
          .then((res) => {
            if (res.available) {
              setSignupStep('details');
            } else {
              setSignupStep('username');
              setUsernameError(res.message ?? 'Username is already taken');
            }
          })
          .finally(() => setCheckingUsername(false));
      } else {
        setSignupStep('username');
      }
    }
  }, [mode, handleParam, verifiedParam]);

  const handleGoogleLogin = async () => {
    setLoginError('');
    setLoginSubmitting(true);
    try {
      const profile = await signInWithGoogle();
      navigate(`/${encodeURIComponent(profile.username)}`, {replace: true});
    } catch (err: unknown) {
      setLoginError(
        err instanceof Error ? err.message : 'Google sign-in failed.',
      );
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleDiscordLogin = () => {
    setLoginError('');
    try {
      startDiscordOAuth({intent: 'auth'});
    } catch (err: unknown) {
      setLoginError(
        err instanceof Error ? err.message : 'Discord OAuth2 failed to start.',
      );
    }
  };

  const handleForgotPassword = async () => {
    setLoginError('');
    setForgotMessage('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail.trim())) {
      setLoginError('Enter your email address first to receive a reset link.');
      return;
    }

    try {
      await sendResetEmail(loginEmail.trim());
      setForgotMessage(`Password reset email sent to ${loginEmail.trim()}.`);
    } catch (err: unknown) {
      setLoginError(
        err instanceof Error ? err.message : 'Failed to send reset email.',
      );
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loginSubmitting) return;
    setLoginError('');
    setForgotMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail.trim())) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    if (loginPassword.length < 6) {
      setLoginError('Password must be at least 6 characters.');
      return;
    }

    setLoginSubmitting(true);
    try {
      const profile = await signInWithEmail(loginEmail.trim(), loginPassword);
      navigate(`/${encodeURIComponent(profile.username)}`, {replace: true});
    } catch (err: unknown) {
      setLoginError(
        err instanceof Error ? err.message : 'Invalid email or password.',
      );
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleUsernameStep = async (e: FormEvent) => {
    e.preventDefault();
    if (checkingUsername) return;

    setCheckingUsername(true);
    setUsernameError('');
    try {
      const check = await checkUsernameAvailability(username);
      if (!check.available) {
        setUsernameError(check.message ?? 'Username is already taken');
        return;
      }
      setUsername(check.cleaned);
      setSignupStep('details');
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleGoogleSignup = async () => {
    setDetailsError('');
    setUsernameError('');
    setSignupSubmitting(true);
    try {
      const profile = await signInWithGoogle(
        signupStep === 'details' ? username : undefined,
        planParam === 'premium' ? 'premium' : 'free',
      );
      navigate(`/${encodeURIComponent(profile.username)}`, {replace: true});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google signup failed.';
      if (signupStep === 'details') {
        setDetailsError(msg);
      } else {
        setUsernameError(msg);
      }
    } finally {
      setSignupSubmitting(false);
    }
  };

  const handleDiscordSignup = () => {
    setDetailsError('');
    setUsernameError('');
    try {
      startDiscordOAuth({
        claimedUsername: signupStep === 'details' ? username : undefined,
        claimedPlan: planParam === 'premium' ? 'premium' : 'free',
        intent: 'auth',
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Discord OAuth2 failed to start.';
      if (signupStep === 'details') {
        setDetailsError(msg);
      } else {
        setUsernameError(msg);
      }
    }
  };

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (signupSubmitting) return;
    setDetailsError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      setDetailsError('Please enter a valid email address.');
      return;
    }

    if (signupPassword.length < 8) {
      setDetailsError('Password must be at least 8 characters.');
      return;
    }

    setSignupSubmitting(true);
    try {
      const profile = await signUpWithEmail(
        username,
        signupEmail.trim(),
        signupPassword,
        planParam === 'premium' ? 'premium' : 'free',
      );
      navigate(`/${encodeURIComponent(profile.username)}`, {replace: true});
    } catch (err: unknown) {
      setDetailsError(
        err instanceof Error ? err.message : 'Failed to create account.',
      );
    } finally {
      setSignupSubmitting(false);
    }
  };

  const selectedOfferLabel = addonParam
    ? addonParam.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : planParam === 'premium'
      ? 'Premium Plan (LKR 1,000 Lifetime)'
      : planParam === 'free'
        ? 'Free Plan (LKR 0)'
        : null;

  return (
    <div className="min-h-[88vh] bg-[#07030d] px-4 sm:px-6 pt-32 sm:pt-36 pb-24 flex items-center justify-center relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[640px] h-[420px] rounded-full blur-[120px] opacity-55"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.24) 0%, rgba(7, 3, 13, 0) 72%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] rounded-2xl bg-gradient-to-b from-[#1a0b2e] via-[#10071e] to-[#0b0515] border border-purple-500/25 p-6 sm:p-8 shadow-[0_24px_80px_rgba(7,3,13,0.9),0_0_45px_rgba(124,58,237,0.18)]">
        {/* Top Sparkle Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span className="text-base font-bold tracking-tight text-white">
            Clouskee <span className="text-[#a855f7]">PP</span>
          </span>
        </div>

        {mode === 'login' ? (
          <>
            <div className="mt-4 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Welcome Back
              </h1>
              <p className="mt-1.5 text-xs text-[#b2abc4]">
                Sign in to manage your profile page and file uploads.
              </p>
            </div>

            {/* Top Discord & Google Provider Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loginSubmitting}
                onClick={handleDiscordLogin}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4f46e5]/85 hover:bg-[#4f46e5] border border-indigo-400/30 py-2.5 px-3 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-60"
              >
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Discord</span>
              </button>

              <button
                type="button"
                disabled={loginSubmitting}
                onClick={handleGoogleLogin}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#141926] hover:bg-[#1c2334] border border-slate-700/70 py-2.5 px-3 text-xs font-semibold text-slate-100 transition-colors cursor-pointer disabled:opacity-60"
              >
                <GoogleIcon />
                <span>Google</span>
              </button>
            </div>

            {/* Divider with OR EMAIL */}
            <div className="mt-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-purple-500/20" />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                OR EMAIL
              </span>
            </div>

            <form
              onSubmit={handleLoginSubmit}
              noValidate
              className="mt-4 space-y-4"
            >
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-medium text-slate-200 mb-1.5"
                >
                  Email Address
                </label>
                <div className="flex items-center rounded-xl bg-[#07030d]/90 border border-purple-500/25 focus-within:border-purple-400 px-3.5 py-2.5">
                  <Mail
                    className="w-4 h-4 text-slate-500 mr-2.5 shrink-0"
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-medium text-slate-200"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-medium text-purple-400 hover:text-purple-300 cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="flex items-center rounded-xl bg-[#07030d]/90 border border-purple-500/25 focus-within:border-purple-400 px-3.5 py-2.5">
                  <Lock
                    className="w-4 h-4 text-slate-500 mr-2.5 shrink-0"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((p) => !p)}
                    aria-label={
                      showLoginPassword ? 'Hide password' : 'Show password'
                    }
                    className="text-slate-400 hover:text-white ml-2 cursor-pointer"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {forgotMessage && (
                <p className="text-[11px] text-emerald-200 bg-emerald-950/45 border border-emerald-500/30 rounded-lg px-3 py-2">
                  {forgotMessage}
                </p>
              )}

              {loginError && (
                <p className="text-xs font-medium text-rose-300 bg-rose-950/45 border border-rose-500/30 rounded-lg px-3 py-2">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5b21b6] via-[#6d28d9] to-[#7c3aed] hover:brightness-110 disabled:opacity-60 border border-purple-400/35 py-3 text-xs sm:text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.45)] transition-all cursor-pointer"
              >
                {loginSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Clouskee PP</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-purple-500/15 text-center text-xs text-slate-400">
              Don&apos;t have an account yet?{' '}
              <Link
                to="/signup"
                className="font-semibold text-white hover:text-purple-300 transition-colors"
              >
                Sign Up Free
              </Link>
            </div>
          </>
        ) : (
          /* /signup — Username-First Flow */
          <>
            <div className="mt-4 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Create your account
              </h1>
              <p className="mt-1.5 text-xs text-[#b2abc4] leading-relaxed">
                Build your profile, share your links, and customize everything
                in one place.
              </p>
            </div>

            {selectedOfferLabel && (
              <div className="mt-4 rounded-xl bg-purple-950/40 border border-purple-500/30 px-3.5 py-2 text-center text-[11px] font-medium text-purple-200">
                Selected offer:{' '}
                <span className="font-semibold text-white">
                  {selectedOfferLabel}
                </span>
              </div>
            )}

            {signupStep === 'username' ? (
              <>
                <form
                  onSubmit={handleUsernameStep}
                  noValidate
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="signup-username"
                      className="block text-xs font-medium text-slate-200 mb-1.5"
                    >
                      Username
                    </label>
                    <div className="flex items-center rounded-xl bg-[#07030d]/90 border border-purple-500/25 focus-within:border-purple-400 px-3.5 py-2.5">
                      <span className="font-mono text-xs text-purple-400 select-none shrink-0">
                        clouskee.pp/
                      </span>
                      <input
                        id="signup-username"
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(sanitizeHandle(e.target.value));
                          if (usernameError) setUsernameError('');
                        }}
                        placeholder="username"
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full min-w-0 bg-transparent pl-1 font-mono text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {usernameError && (
                    <div className="flex items-start gap-2 rounded-lg bg-rose-950/45 border border-rose-500/30 px-3 py-2 text-xs text-rose-200">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{usernameError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={checkingUsername}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5b21b6] via-[#6d28d9] to-[#7c3aed] hover:brightness-110 disabled:opacity-65 border border-purple-400/35 py-3 text-xs sm:text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.45)] transition-all cursor-pointer"
                  >
                    {checkingUsername ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Checking Availability...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider with OR */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-purple-500/20" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                    OR
                  </span>
                </div>

                {/* Instant Google OR Discord Signup */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={signupSubmitting}
                    onClick={handleDiscordSignup}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4f46e5]/85 hover:bg-[#4f46e5] border border-indigo-400/30 py-2.5 px-3 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Discord</span>
                  </button>

                  <button
                    type="button"
                    disabled={signupSubmitting}
                    onClick={handleGoogleSignup}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#141926] hover:bg-[#1c2334] border border-slate-700/70 py-2.5 px-3 text-xs font-semibold text-slate-100 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <GoogleIcon />
                    <span>Google</span>
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: Confirmed Available Username -> Complete with Google, Discord, or Email */
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-950/35 border border-emerald-500/30 px-3.5 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono text-xs text-emerald-100 truncate">
                      clouskee.pp/{username} is available
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSignupStep('username')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-white shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change</span>
                  </button>
                </div>

                {/* Instant OAuth Completion Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={signupSubmitting}
                    onClick={handleGoogleSignup}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#141926] hover:bg-[#1c2334] border border-slate-700/70 py-2.5 px-3 text-xs font-semibold text-slate-100 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <GoogleIcon />
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    disabled={signupSubmitting}
                    onClick={handleDiscordSignup}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4f46e5]/85 hover:bg-[#4f46e5] border border-indigo-400/30 py-2.5 px-3 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <MessageCircle
                      className="w-3.5 h-3.5"
                      aria-hidden="true"
                    />
                    <span>Discord</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-purple-500/20" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                    OR EMAIL
                  </span>
                </div>

                <form
                  onSubmit={handleEmailSignup}
                  noValidate
                  className="space-y-3.5"
                >
                  <div>
                    <label
                      htmlFor="signup-email"
                      className="block text-xs font-medium text-slate-200 mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="flex items-center rounded-xl bg-[#07030d]/90 border border-purple-500/25 focus-within:border-purple-400 px-3.5 py-2.5">
                      <Mail
                        className="w-4 h-4 text-slate-500 mr-2.5 shrink-0"
                        aria-hidden="true"
                      />
                      <input
                        id="signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-password"
                      className="block text-xs font-medium text-slate-200 mb-1.5"
                    >
                      Password
                    </label>
                    <div className="flex items-center rounded-xl bg-[#07030d]/90 border border-purple-500/25 focus-within:border-purple-400 px-3.5 py-2.5">
                      <Lock
                        className="w-4 h-4 text-slate-500 mr-2.5 shrink-0"
                        aria-hidden="true"
                      />
                      <input
                        id="signup-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((p) => !p)}
                        aria-label={
                          showSignupPassword ? 'Hide password' : 'Show password'
                        }
                        className="text-slate-400 hover:text-white ml-2 cursor-pointer"
                      >
                        {showSignupPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {detailsError && (
                    <p className="text-xs font-medium text-rose-300 bg-rose-950/45 border border-rose-500/30 rounded-lg px-3 py-2">
                      {detailsError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={signupSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5b21b6] via-[#6d28d9] to-[#7c3aed] hover:brightness-110 disabled:opacity-60 border border-purple-400/35 py-3 text-xs sm:text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.45)] transition-all cursor-pointer"
                  >
                    {signupSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-purple-500/15 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-white hover:text-purple-300 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import {useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {AlertCircle, Loader2} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {
  consumePendingDiscordContext,
  verifyDiscordOAuthState,
} from '../lib/discord';

export function DiscordCallbackPage() {
  const navigate = useNavigate();
  const {completeDiscordTokenLogin} = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const hashString = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hashString);
    const accessToken = params.get('access_token');
    const returnedError = params.get('error_description') || params.get('error');
    const state = params.get('state');

    // If opened inside an OAuth popup from the AI Studio iframe, hand token to opener
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(
          {
            type: 'CLOUSKEE_DISCORD_TOKEN',
            accessToken,
            state,
            error: returnedError,
          },
          window.location.origin,
        );
        window.close();
        return;
      } catch {
        // Fallback to in-page completion below if opener is inaccessible
      }
    }

    if (returnedError) {
      setError(returnedError);
      return;
    }

    if (!accessToken) {
      setError('No Discord access token was returned in the callback URL.');
      return;
    }

    if (!verifyDiscordOAuthState(state)) {
      setError('Discord OAuth2 state verification failed. Please try again.');
      return;
    }

    const {claimedUsername, claimedPlan, intent} =
      consumePendingDiscordContext();

    completeDiscordTokenLogin(
      accessToken,
      claimedUsername,
      claimedPlan,
      intent,
    )
      .then((profile) => {
        if (intent === 'link') {
          navigate('/dashboard', {replace: true});
        } else {
          navigate(`/${encodeURIComponent(profile.username)}`, {replace: true});
        }
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to complete Discord authentication.',
        );
      });
  }, [completeDiscordTokenLogin, navigate]);

  return (
    <div className="min-h-[85vh] bg-[#07030d] px-4 pt-36 pb-24 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-[#0e071a] border border-purple-500/25 p-8 text-center shadow-[0_24px_80px_rgba(7,3,13,0.9)]">
        {error ? (
          <>
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/15 border border-rose-400/30 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>
            <h1 className="text-xl font-bold text-white">
              Discord Sign-In Failed
            </h1>
            <p className="mt-2.5 text-xs sm:text-sm text-rose-200 leading-relaxed">
              {error}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                to="/login"
                className="rounded-xl bg-purple-600 hover:bg-purple-500 px-5 py-2.5 text-xs font-semibold text-white transition-colors"
              >
                Back to Login
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-[#160b29] border border-purple-500/30 px-5 py-2.5 text-xs font-semibold text-purple-200 hover:text-white transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white">
              Connecting Discord Profile...
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#b2abc4]">
              Syncing your Discord global name, avatar, and avatar decoration
              with Clouskee PP.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

import {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {Loader2, Sparkles} from 'lucide-react';
import {useAuth} from '../context/AuthContext';
import {
  getProfileByUsername,
  isSupabaseConfigured,
  ProfileRecord,
  recordUniqueProfileView,
} from '../lib/supabase';
import {ProfileView} from '../components/ProfileView';

export function ProfilePage() {
  const {username = ''} = useParams<{username: string}>();
  const {activeProfile} = useAuth();

  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cleanUsername = username.trim().toLowerCase();

    async function loadProfile() {
      setLoading(true);
      setNotFound(false);

      if (
        activeProfile &&
        activeProfile.username.toLowerCase() === cleanUsername &&
        !isSupabaseConfigured
      ) {
        if (!cancelled) {
          setProfile(activeProfile);
          setLoading(false);
        }
        return;
      }

      const {data} = await getProfileByUsername(cleanUsername);
      if (cancelled) return;

      if (!data) {
        if (
          activeProfile &&
          activeProfile.username.toLowerCase() === cleanUsername
        ) {
          setProfile(activeProfile);
          setLoading(false);
          return;
        }
        setProfile(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);

      // Strictly record at most 1 view per IP address exclusively on /:username
      const result = await recordUniqueProfileView(cleanUsername);
      if (!cancelled && result.counted) {
        setProfile((prev) =>
          prev ? {...prev, views: (prev.views ?? 0) + 1} : prev,
        );
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [username, activeProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07030d] px-4 flex items-center justify-center">
        <Loader2 className="w-9 h-9 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#07030d] px-4 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-[#0d0718] border border-purple-500/25 p-8 text-center shadow-[0_24px_80px_rgba(7,3,13,0.9)]">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-600/20 border border-purple-400/30 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            clouskee.pp/{username.toLowerCase()} is unclaimed
          </h1>
          <p className="mt-2.5 text-sm text-[#b2abc4]">
            This profile page has not been registered yet. Claim it now in
            seconds.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={`/signup?handle=${encodeURIComponent(username.toLowerCase())}`}
              className="rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] hover:brightness-110 px-5 py-2.5 text-sm font-semibold text-white transition-all"
            >
              Claim This Handle
            </Link>
            <Link
              to="/"
              className="rounded-xl bg-[#160b29] border border-purple-500/30 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
            >
              Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ProfileView profile={profile} isPreview={false} />;
}

export default ProfilePage;

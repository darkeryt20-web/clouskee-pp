import {ReactNode, useEffect, useState} from 'react';
import {Navigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
import {auth} from '../lib/firebase';
import {verifyAdminAccessInSupabase} from '../lib/supabase';
import {LoadingSpinner} from './LoadingSpinner';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({children}: AdminRouteProps) {
  const {firebaseUser, activeProfile, loading} = useAuth();
  const [status, setStatus] = useState<'checking' | 'authorized' | 'denied'>(
    'checking',
  );

  useEffect(() => {
    if (loading) return;

    const verifiedFirebaseUid =
      auth?.currentUser?.uid ?? firebaseUser?.uid ?? activeProfile?.firebase_uid ?? null;
    const verifiedDiscordId = activeProfile?.discord_id ?? null;

    // Require an active authenticated identity before querying Supabase
    if (!firebaseUser && !activeProfile) {
      setStatus('denied');
      return;
    }

    if (!verifiedFirebaseUid && !verifiedDiscordId) {
      setStatus('denied');
      return;
    }

    let cancelled = false;
    setStatus('checking');

    verifyAdminAccessInSupabase({
      firebaseUid: verifiedFirebaseUid,
      discordId: verifiedDiscordId,
    })
      .then((res) => {
        if (cancelled) return;
        setStatus(res.isAdmin ? 'authorized' : 'denied');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('denied');
      });

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    firebaseUser,
    activeProfile?.firebase_uid,
    activeProfile?.discord_id,
    activeProfile,
  ]);

  if (loading || status === 'checking') {
    return <LoadingSpinner label="Verifying administrator permissions..." />;
  }

  if (status !== 'authorized') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

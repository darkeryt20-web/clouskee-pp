import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  linkWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import {auth, googleProvider, isFirebaseConfigured} from '../lib/firebase';
import {
  createProfileRecord,
  getProfileByDiscordId,
  getProfileByFirebaseOrEmail,
  getProfileByUsername,
  isSupabaseConfigured,
  ProfileRecord,
  updateProfileRecord,
} from '../lib/supabase';
import {
  buildDiscordAuthorizeUrl,
  consumePendingDiscordContext,
  fetchDiscordUser,
  isDiscordConfigured,
  setPendingDiscordSignup,
  verifyDiscordOAuthState,
} from '../lib/discord';
import {getRuntimeDomainInfo} from '../lib/domain';
import {
  checkUsernameAvailability,
  generateSafeFallbackHandle,
  markUsernameClaimed,
  sanitizeHandle,
} from '../utils/usernameRegistry';

const ACTIVE_PROFILE_STORAGE_KEY = 'clouskee_active_profile_v1';

interface AuthContextValue {
  firebaseUser: User | null;
  activeProfile: ProfileRecord | null;
  loading: boolean;
  setActiveProfile: (profile: ProfileRecord | null) => void;
  refreshActiveProfile: () => Promise<ProfileRecord | null>;
  signInWithGoogle: (
    claimedUsername?: string,
    plan?: string,
  ) => Promise<ProfileRecord>;
  linkGoogleAccount: () => Promise<ProfileRecord>;
  signInWithEmail: (email: string, password: string) => Promise<ProfileRecord>;
  signUpWithEmail: (
    username: string,
    email: string,
    password: string,
    plan?: string,
  ) => Promise<ProfileRecord>;
  sendResetEmail: (email: string) => Promise<void>;
  startDiscordOAuth: (options?: {
    claimedUsername?: string;
    claimedPlan?: string;
    intent?: 'auth' | 'link';
  }) => void;
  completeDiscordTokenLogin: (
    accessToken: string,
    claimedUsername: string | null,
    claimedPlan: string | null,
    intent: 'auth' | 'link',
  ) => Promise<ProfileRecord>;
  changeUsername: (newUsername: string) => Promise<ProfileRecord>;
  updateOwnProfile: (
    updates: Partial<ProfileRecord>,
  ) => Promise<ProfileRecord | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredProfile(): ProfileRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProfileRecord) : null;
  } catch {
    return null;
  }
}

function writeStoredProfile(profile: ProfileRecord | null) {
  if (typeof window === 'undefined') return;
  try {
    if (profile) {
      window.sessionStorage.setItem(
        ACTIVE_PROFILE_STORAGE_KEY,
        JSON.stringify(profile),
      );
    } else {
      window.sessionStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function AuthProvider({children}: {children: ReactNode}) {
  const navigate = useNavigate();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfileState] = useState<ProfileRecord | null>(
    () => readStoredProfile(),
  );
  const [loading, setLoading] = useState(true);

  const setActiveProfile = useCallback((profile: ProfileRecord | null) => {
    setActiveProfileState(profile);
    writeStoredProfile(profile);
  }, []);

  const refreshActiveProfile = useCallback(async () => {
    const current = activeProfile;
    if (!current || !isSupabaseConfigured) return current;
    const {data} = await getProfileByUsername(current.username);
    if (data) {
      setActiveProfile(data);
      return data;
    }
    return current;
  }, [activeProfile, setActiveProfile]);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user && isSupabaseConfigured) {
        const {data} = await getProfileByFirebaseOrEmail(user.uid, user.email);
        if (data) {
          setActiveProfile(data);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setActiveProfile]);

  const ensureUniqueUsername = useCallback(async (desired: string) => {
    const base =
      sanitizeHandle(desired) || `user${String(Date.now()).slice(-4)}`;
    if (!isSupabaseConfigured) return base;

    const firstCheck = await getProfileByUsername(base);
    if (!firstCheck.data) return base;

    const suffix = String(Math.floor(100 + Math.random() * 900));
    return sanitizeHandle(`${base}${suffix}`);
  }, []);

  const signInWithGoogle = useCallback(
    async (claimedUsername?: string, plan = 'free') => {
      if (!isFirebaseConfigured || !auth || !googleProvider) {
        throw new Error(
          'Firebase Authentication is not configured yet. Add your VITE_FIREBASE_* keys in environment settings.',
        );
      }

      const credential = await signInWithPopup(auth, googleProvider);
      const user = credential.user;

      if (isSupabaseConfigured) {
        const existing = await getProfileByFirebaseOrEmail(
          user.uid,
          user.email,
        );
        if (existing.data) {
          const updates: Partial<ProfileRecord> = {};
          if (!existing.data.firebase_uid) updates.firebase_uid = user.uid;
          if (!existing.data.global_name && user.displayName) {
            updates.global_name = user.displayName;
          }
          if (!existing.data.avatar_url && user.photoURL) {
            updates.avatar_url = user.photoURL;
          }
          if (Object.keys(updates).length > 0) {
            const updated = await updateProfileRecord(
              existing.data.id,
              updates,
            );
            const finalProfile = updated.data ?? existing.data;
            setActiveProfile(finalProfile);
            return finalProfile;
          }
          setActiveProfile(existing.data);
          return existing.data;
        }
      }

      const candidateHandle = claimedUsername
        ? sanitizeHandle(claimedUsername)
        : await ensureUniqueUsername(
            generateSafeFallbackHandle(user.displayName, user.email),
          );

      const created = await createProfileRecord({
        firebase_uid: user.uid,
        email: user.email,
        username: candidateHandle,
        global_name: user.displayName || candidateHandle,
        avatar_url: user.photoURL || null,
        plan: plan === 'premium' ? 'premium' : 'free',
        badges: plan === 'premium' ? ['💎 Premium'] : [],
      });

      if (created.error || !created.data) {
        throw new Error(
          created.error || 'Failed to create profile in Supabase.',
        );
      }

      markUsernameClaimed(created.data.username);
      setActiveProfile(created.data);
      return created.data;
    },
    [ensureUniqueUsername, setActiveProfile],
  );

  const linkGoogleAccount = useCallback(async () => {
    if (!activeProfile) {
      throw new Error('You must be signed in to link a Google account.');
    }
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error(
        'Firebase Authentication is not configured yet. Add your VITE_FIREBASE_* keys first.',
      );
    }

    const credential = auth.currentUser
      ? await linkWithPopup(auth.currentUser, googleProvider)
      : await signInWithPopup(auth, googleProvider);

    const user = credential.user;

    const updates: Partial<ProfileRecord> = {
      firebase_uid: user.uid,
      email: activeProfile.email || user.email,
      global_name:
        activeProfile.global_name ||
        user.displayName ||
        activeProfile.username,
      avatar_url: activeProfile.avatar_url || user.photoURL || null,
    };

    if (!isSupabaseConfigured || activeProfile.id.startsWith('local-')) {
      const merged = {...activeProfile, ...updates};
      setActiveProfile(merged);
      return merged;
    }

    const updated = await updateProfileRecord(activeProfile.id, updates);
    if (updated.error || !updated.data) {
      throw new Error(updated.error || 'Failed to link Google account.');
    }

    setActiveProfile(updated.data);
    return updated.data;
  }, [activeProfile, setActiveProfile]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!isFirebaseConfigured || !auth) {
        throw new Error(
          'Firebase Authentication is not configured yet. Add your VITE_FIREBASE_* keys in environment settings.',
        );
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = credential.user;

      if (isSupabaseConfigured) {
        const existing = await getProfileByFirebaseOrEmail(
          user.uid,
          user.email,
        );
        if (existing.data) {
          setActiveProfile(existing.data);
          return existing.data;
        }
      }

      const fallbackHandle = await ensureUniqueUsername(
        generateSafeFallbackHandle(user.displayName, user.email),
      );
      const created = await createProfileRecord({
        firebase_uid: user.uid,
        email: user.email,
        username: fallbackHandle,
        global_name: user.displayName || fallbackHandle,
        avatar_url: user.photoURL || null,
      });

      if (created.error || !created.data) {
        throw new Error(created.error || 'Failed to load user profile.');
      }

      setActiveProfile(created.data);
      return created.data;
    },
    [ensureUniqueUsername, setActiveProfile],
  );

  const signUpWithEmail = useCallback(
    async (username: string, email: string, password: string, plan = 'free') => {
      if (!isFirebaseConfigured || !auth) {
        throw new Error(
          'Firebase Authentication is not configured yet. Add your VITE_FIREBASE_* keys in environment settings.',
        );
      }

      const cleanHandle = sanitizeHandle(username);
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = credential.user;

      const created = await createProfileRecord({
        firebase_uid: user.uid,
        email: user.email,
        username: cleanHandle,
        global_name: cleanHandle,
        avatar_url: user.photoURL || null,
        plan: plan === 'premium' ? 'premium' : 'free',
        badges: plan === 'premium' ? ['💎 Premium'] : [],
      });

      if (created.error || !created.data) {
        throw new Error(
          created.error || 'Failed to save profile in Supabase.',
        );
      }

      markUsernameClaimed(created.data.username);
      setActiveProfile(created.data);
      return created.data;
    },
    [setActiveProfile],
  );

  const sendResetEmail = useCallback(async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase Authentication is not configured yet. Add your VITE_FIREBASE_* keys first.',
      );
    }
    await sendPasswordResetEmail(auth, email);
  }, []);

  const completeDiscordTokenLogin = useCallback(
    async (
      accessToken: string,
      claimedUsername: string | null,
      claimedPlan: string | null,
      intent: 'auth' | 'link',
    ): Promise<ProfileRecord> => {
      const discordUser = await fetchDiscordUser(accessToken);

      const currentSessionProfile = activeProfile ?? readStoredProfile();
      if (intent === 'link' && currentSessionProfile) {
        const updates: Partial<ProfileRecord> = {
          discord_id: discordUser.discord_id,
          discord_username: discordUser.discord_username,
          discord_global_name: discordUser.discord_global_name,
          discord_avatar: discordUser.discord_avatar,
          discord_avatar_decoration: discordUser.discord_avatar_decoration,
          global_name:
            discordUser.discord_global_name ||
            currentSessionProfile.global_name,
          avatar_url:
            discordUser.discord_avatar || currentSessionProfile.avatar_url,
          avatar_decoration_url: discordUser.discord_avatar_decoration,
        };

        if (
          !isSupabaseConfigured ||
          currentSessionProfile.id.startsWith('local-')
        ) {
          const merged = {...currentSessionProfile, ...updates};
          setActiveProfile(merged);
          return merged;
        }

        const updated = await updateProfileRecord(
          currentSessionProfile.id,
          updates,
        );

        if (updated.error || !updated.data) {
          throw new Error(updated.error || 'Failed to link Discord account.');
        }
        setActiveProfile(updated.data);
        return updated.data;
      }

      if (isSupabaseConfigured) {
        const existingByDiscord = await getProfileByDiscordId(
          discordUser.discord_id,
        );
        if (existingByDiscord.data) {
          const updated = await updateProfileRecord(existingByDiscord.data.id, {
            discord_username: discordUser.discord_username,
            discord_global_name: discordUser.discord_global_name,
            discord_avatar: discordUser.discord_avatar,
            discord_avatar_decoration: discordUser.discord_avatar_decoration,
            global_name:
              existingByDiscord.data.global_name ||
              discordUser.discord_global_name,
            avatar_url:
              discordUser.discord_avatar || existingByDiscord.data.avatar_url,
            avatar_decoration_url: discordUser.discord_avatar_decoration,
          });
          const synced = updated.data ?? existingByDiscord.data;
          setActiveProfile(synced);
          return synced;
        }
      }

      const desiredHandle = claimedUsername
        ? sanitizeHandle(claimedUsername)
        : await ensureUniqueUsername(discordUser.discord_username);

      const created = await createProfileRecord({
        email: discordUser.email,
        username: desiredHandle,
        global_name: discordUser.discord_global_name,
        avatar_url: discordUser.discord_avatar,
        avatar_decoration_url: discordUser.discord_avatar_decoration,
        discord_id: discordUser.discord_id,
        discord_username: discordUser.discord_username,
        discord_global_name: discordUser.discord_global_name,
        discord_avatar: discordUser.discord_avatar,
        discord_avatar_decoration: discordUser.discord_avatar_decoration,
        plan: claimedPlan === 'premium' ? 'premium' : 'free',
        badges: claimedPlan === 'premium' ? ['💎 Premium'] : [],
      });

      if (created.error || !created.data) {
        throw new Error(
          created.error || 'Failed to create Discord profile in Supabase.',
        );
      }

      markUsernameClaimed(created.data.username);
      setActiveProfile(created.data);
      return created.data;
    },
    [activeProfile, ensureUniqueUsername, setActiveProfile],
  );

  const startDiscordOAuth = useCallback(
    (options?: {
      claimedUsername?: string;
      claimedPlan?: string;
      intent?: 'auth' | 'link';
    }) => {
      if (!isDiscordConfigured) {
        throw new Error(
          'Discord OAuth2 is not configured yet. Add VITE_DISCORD_CLIENT_ID to your environment.',
        );
      }

      setPendingDiscordSignup(
        options?.claimedUsername ?? null,
        options?.claimedPlan ?? null,
        options?.intent ?? 'auth',
      );

      const authorizeUrl = buildDiscordAuthorizeUrl();
      const {isIframe} = getRuntimeDomainInfo();

      if (isIframe) {
        const popup = window.open(
          authorizeUrl,
          'clouskee_discord_oauth',
          'width=520,height=720',
        );
        if (popup) return;
      }

      window.location.assign(authorizeUrl);
    },
    [],
  );

  const changeUsername = useCallback(
    async (newUsername: string) => {
      if (!activeProfile) {
        throw new Error('No active profile session.');
      }
      const check = await checkUsernameAvailability(
        newUsername,
        activeProfile.id,
      );
      if (!check.available) {
        throw new Error(check.message || 'Username is already taken');
      }

      if (!isSupabaseConfigured || activeProfile.id.startsWith('local-')) {
        const updatedLocal = {...activeProfile, username: check.cleaned};
        markUsernameClaimed(check.cleaned);
        setActiveProfile(updatedLocal);
        return updatedLocal;
      }

      const res = await updateProfileRecord(activeProfile.id, {
        username: check.cleaned,
      });
      if (res.error || !res.data) {
        throw new Error(res.error || 'Failed to update username.');
      }

      markUsernameClaimed(res.data.username);
      setActiveProfile(res.data);
      return res.data;
    },
    [activeProfile, setActiveProfile],
  );

  const updateOwnProfile = useCallback(
    async (updates: Partial<ProfileRecord>) => {
      if (!activeProfile) return null;
      if (!isSupabaseConfigured || activeProfile.id.startsWith('local-')) {
        const merged = {...activeProfile, ...updates};
        setActiveProfile(merged);
        return merged;
      }
      const res = await updateProfileRecord(activeProfile.id, updates);
      if (res.error) {
        throw new Error(res.error);
      }
      if (res.data) {
        setActiveProfile(res.data);
        return res.data;
      }
      return activeProfile;
    },
    [activeProfile, setActiveProfile],
  );

  const signOut = useCallback(async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    setFirebaseUser(null);
    setActiveProfile(null);
  }, [setActiveProfile]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'CLOUSKEE_DISCORD_TOKEN') return;
      const accessToken = event.data?.accessToken as string | null;
      const state = event.data?.state as string | null;
      if (!accessToken || !verifyDiscordOAuthState(state)) return;

      try {
        const {claimedUsername, claimedPlan, intent} =
          consumePendingDiscordContext();
        const synced = await completeDiscordTokenLogin(
          accessToken,
          claimedUsername,
          claimedPlan,
          intent,
        );
        if (intent === 'link') {
          navigate('/dashboard', {replace: true});
        } else {
          navigate(`/${encodeURIComponent(synced.username)}`, {replace: true});
        }
      } catch {
        // Handled by callback fallback
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [completeDiscordTokenLogin, navigate]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        activeProfile,
        loading,
        setActiveProfile,
        refreshActiveProfile,
        signInWithGoogle,
        linkGoogleAccount,
        signInWithEmail,
        signUpWithEmail,
        sendResetEmail,
        startDiscordOAuth,
        completeDiscordTokenLogin,
        changeUsername,
        updateOwnProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

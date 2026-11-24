import {useEffect, useState} from 'react';

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
  downlink?: number;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

export interface PerformanceProfile {
  saveData: boolean;
  isSlowConnection: boolean;
  isLowSpecDevice: boolean;
  prefersReducedMotion: boolean;
  isLowData: boolean;
  isConstrainedDevice: boolean;
  skipBackgroundVideo: boolean;
  reduceAnimations: boolean;
}

function getNetworkConnection(): NetworkInformationLike | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection ?? null;
}

function readPerformanceProfile(): PerformanceProfile {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      saveData: false,
      isSlowConnection: false,
      isLowSpecDevice: false,
      prefersReducedMotion: false,
      isLowData: false,
      isConstrainedDevice: false,
      skipBackgroundVideo: false,
      reduceAnimations: false,
    };
  }

  const conn = getNetworkConnection();
  const saveData = Boolean(conn?.saveData);
  const effectiveType = (conn?.effectiveType ?? '').toLowerCase();
  const isSlowConnection =
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    effectiveType === '3g' ||
    (typeof conn?.downlink === 'number' &&
      conn.downlink > 0 &&
      conn.downlink < 1.5);

  const navWithMemory = navigator as Navigator & {deviceMemory?: number};
  const cores = navigator.hardwareConcurrency;
  const memory = navWithMemory.deviceMemory;
  const isLowSpecDevice =
    (typeof cores === 'number' && cores > 0 && cores <= 4) ||
    (typeof memory === 'number' && memory > 0 && memory <= 4);

  const prefersReducedMotion = Boolean(
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  const isLowData = saveData || isSlowConnection;
  const isConstrainedDevice = isLowData || isLowSpecDevice;
  const skipBackgroundVideo =
    isLowData || isLowSpecDevice || prefersReducedMotion;
  const reduceAnimations =
    prefersReducedMotion || isLowSpecDevice || isLowData;

  return {
    saveData,
    isSlowConnection,
    isLowSpecDevice,
    prefersReducedMotion,
    isLowData,
    isConstrainedDevice,
    skipBackgroundVideo,
    reduceAnimations,
  };
}

export function usePerformanceProfile(): PerformanceProfile {
  const [profile, setProfile] = useState<PerformanceProfile>(() =>
    readPerformanceProfile(),
  );

  useEffect(() => {
    const update = () => setProfile(readPerformanceProfile());
    update();

    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    mq?.addEventListener('change', update);

    const conn = getNetworkConnection();
    conn?.addEventListener?.('change', update);

    return () => {
      mq?.removeEventListener('change', update);
      conn?.removeEventListener?.('change', update);
    };
  }, []);

  return profile;
}

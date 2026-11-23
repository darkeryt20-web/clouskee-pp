import {useEffect, useState} from 'react';
import {CustomCursorStyle} from '../lib/supabase';
import {sanitizeExternalUrl} from '../lib/domain';
import {SmartImage} from './CloudinaryMedia';

export const CURSOR_STYLES: {id: CustomCursorStyle; label: string}[] = [
  {id: 'dot_ring', label: 'Dot & Ring'},
  {id: 'glow_orb', label: 'Glow Orb'},
  {id: 'crosshair', label: 'Crosshair'},
  {id: 'custom_image', label: 'Custom Image / .CUR'},
];

interface CustomCursorLayerProps {
  enabled: boolean;
  style: CustomCursorStyle;
  customUrl: string | null | undefined;
  accentColor: string;
  isPreview: boolean;
  position: {x: number; y: number; visible: boolean};
}

export function useFinePointer(): boolean {
  const [fine, setFine] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: fine)');
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return fine;
}

export function CustomCursorLayer({
  enabled,
  style,
  customUrl,
  accentColor,
  isPreview,
  position,
}: CustomCursorLayerProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const safeCursorUrl = sanitizeExternalUrl(customUrl);

  useEffect(() => {
    setImgFailed(false);
  }, [safeCursorUrl, style]);

  if (!enabled || !position.visible) return null;

  const effectiveStyle: CustomCursorStyle =
    style === 'custom_image' && (!safeCursorUrl || imgFailed)
      ? 'dot_ring'
      : style;

  const placementClass = isPreview ? 'absolute' : 'fixed';

  return (
    <div
      aria-hidden="true"
      className={`${placementClass} top-0 left-0 z-[70] pointer-events-none select-none will-change-transform`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
    >
      {effectiveStyle === 'custom_image' && safeCursorUrl && (
        <SmartImage
          src={safeCursorUrl}
          alt=""
          ariaHidden
          onErrorFallback={() => setImgFailed(true)}
          className="w-7 h-7 object-contain -translate-x-1 -translate-y-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]"
        />
      )}

      {effectiveStyle === 'dot_ring' && (
        <div className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <span
            className="w-7 h-7 rounded-full border transition-transform duration-100"
            style={{
              borderColor: `${accentColor}aa`,
              backgroundColor: `${accentColor}14`,
            }}
          />
          <span
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{backgroundColor: '#ffffff'}}
          />
        </div>
      )}

      {effectiveStyle === 'glow_orb' && (
        <div
          className="w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[2px] opacity-85"
          style={{
            background: `radial-gradient(circle, #ffffff 0%, ${accentColor}cc 35%, ${accentColor}00 72%)`,
          }}
        />
      )}

      {effectiveStyle === 'crosshair' && (
        <div className="relative w-6 h-6 -translate-x-1/2 -translate-y-1/2">
          <span
            className="absolute left-1/2 top-0 -translate-x-1/2 w-[1.5px] h-2"
            style={{backgroundColor: accentColor}}
          />
          <span
            className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[1.5px] h-2"
            style={{backgroundColor: accentColor}}
          />
          <span
            className="absolute top-1/2 left-0 -translate-y-1/2 h-[1.5px] w-2"
            style={{backgroundColor: accentColor}}
          />
          <span
            className="absolute top-1/2 right-0 -translate-y-1/2 h-[1.5px] w-2"
            style={{backgroundColor: accentColor}}
          />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white" />
        </div>
      )}
    </div>
  );
}

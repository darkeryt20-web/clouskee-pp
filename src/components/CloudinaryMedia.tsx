import {AdvancedImage, AdvancedVideo} from '@cloudinary/react';
import type {VideoSources} from '@cloudinary/html';
import {videoCodec} from '@cloudinary/url-gen/actions/transcode';
import {auto} from '@cloudinary/url-gen/qualifiers/videoCodec';
import {CSSProperties, ReactNode, RefObject, useEffect, useMemo, useState} from 'react';
import {
  buildCloudinaryImage,
  buildCloudinaryVideo,
  parseCloudinaryAsset,
} from '../lib/cloudinaryUpload.js';
import {sanitizeExternalUrl} from '../lib/domain';

interface SmartImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  style?: CSSProperties;
  width?: number;
  height?: number;
  ariaHidden?: boolean;
  fallback?: ReactNode;
  onErrorFallback?: () => void;
}

/**
 * Renders Cloudinary images via @cloudinary/react <AdvancedImage> with f_auto,q_auto
 * and seamlessly falls back to standard <img> for external URLs or `fallback` on failure.
 */
export function SmartImage({
  src,
  alt,
  className,
  style,
  width,
  height,
  ariaHidden,
  fallback = null,
  onErrorFallback,
}: SmartImageProps) {
  const safeSrc = sanitizeExternalUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
  }, [safeSrc]);

  const cldImg = useMemo(
    () => (safeSrc ? buildCloudinaryImage(safeSrc, {width, height}) : null),
    [safeSrc, width, height],
  );

  if (!safeSrc || failedSrc === safeSrc) {
    return <>{fallback}</>;
  }

  const handleError = () => {
    setFailedSrc(safeSrc);
    onErrorFallback?.();
  };

  if (cldImg) {
    return (
      <AdvancedImage
        cldImg={cldImg}
        alt={alt}
        aria-hidden={ariaHidden}
        referrerPolicy="no-referrer"
        onError={handleError}
        className={className}
        style={style}
      />
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      aria-hidden={ariaHidden}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
      style={style}
    />
  );
}

interface SmartBackgroundVideoProps {
  src: string | null | undefined;
  videoRef: RefObject<HTMLVideoElement | null>;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders strictly muted looping background videos via @cloudinary/react <AdvancedVideo>
 * for Cloudinary assets or standard <video> for external URLs, hiding cleanly on error.
 */
export function SmartBackgroundVideo({
  src,
  videoRef,
  className,
  style,
}: SmartBackgroundVideoProps) {
  const safeSrc = sanitizeExternalUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    setFailedSrc(null);
  }, [safeSrc]);

  const cldVid = useMemo(
    () => (safeSrc ? buildCloudinaryVideo(safeSrc) : null),
    [safeSrc],
  );

  const videoSources: VideoSources = useMemo(() => {
    if (!safeSrc) return undefined;
    const asset = parseCloudinaryAsset(safeSrc);
    const transcodeAction = videoCodec(auto());
    if (asset?.extension === 'webm') {
      return [
        {
          type: 'webm',
          codecs: undefined as unknown as string[],
          transcode: transcodeAction,
        },
        {
          type: 'mp4',
          codecs: undefined as unknown as string[],
          transcode: transcodeAction,
        },
      ];
    }
    return [
      {
        type: 'mp4',
        codecs: undefined as unknown as string[],
        transcode: transcodeAction,
      },
    ];
  }, [safeSrc]);

  if (!safeSrc || failedSrc === safeSrc) {
    return null;
  }

  const enforceMuted = () => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
    }
  };

  if (cldVid) {
    return (
      <AdvancedVideo
        cldVid={cldVid}
        sources={videoSources}
        innerRef={videoRef}
        autoPlay
        loop
        muted
        playsInline
        onLoadedMetadata={enforceMuted}
        onError={() => setFailedSrc(safeSrc)}
        className={className}
        style={style}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={safeSrc}
      autoPlay
      loop
      muted
      playsInline
      onLoadedMetadata={enforceMuted}
      onError={() => setFailedSrc(safeSrc)}
      className={className}
      style={style}
    />
  );
}

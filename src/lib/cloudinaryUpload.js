import {Cloudinary} from '@cloudinary/url-gen';
import {format, quality} from '@cloudinary/url-gen/actions/delivery';
import {fill} from '@cloudinary/url-gen/actions/resize';

export const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'gwz68wfo';

export const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'clouskee_unsigned';

export const cloudinaryClient = new Cloudinary({
  cloud: {
    cloudName: CLOUDINARY_CLOUD_NAME,
  },
});

const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|avi|mkv|ogv)$/i;
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|bmp|svg|ico|cur)$/i;
const NON_TRANSFORMABLE_EXT_RE = /\.(svg|cur|ani|ico)$/i;
const DUPLICATE_VIDEO_EXT_RE =
  /(\.(?:mp4|webm|mov|m4v|ogv))(?:\.(?:mp4|webm|mov|m4v|ogv))+$/i;
const TRAILING_ASSET_EXT_RE =
  /\.(mp4|webm|mov|m4v|avi|mkv|ogv|png|jpe?g|gif|webp|avif|bmp)$/i;

/**
 * Normalizes accidental duplicate video extensions (e.g. `.mp4.mp4`, `.mp4.webm`)
 * down to a single extension so video URLs never 404.
 *
 * @param {string | null | undefined} url
 * @returns {string}
 */
export function sanitizeCloudinaryMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    parsed.pathname = parsed.pathname.replace(DUPLICATE_VIDEO_EXT_RE, '$1');
    return parsed.toString();
  } catch {
    return trimmed.replace(DUPLICATE_VIDEO_EXT_RE, '$1');
  }
}

/**
 * Determine Cloudinary upload endpoint resource type for a file.
 * @param {File} file
 * @returns {'video' | 'image' | 'auto'}
 */
export function detectCloudinaryResourceType(file) {
  const mime = (file?.type || '').toLowerCase();
  const name = file?.name || '';

  if (mime.startsWith('video/') || VIDEO_EXT_RE.test(name)) {
    return 'video';
  }
  if (mime.startsWith('image/') || IMAGE_EXT_RE.test(name)) {
    return 'image';
  }
  return 'auto';
}

/**
 * Upload an image, video, cursor, or audio file directly to Cloudinary using an unsigned upload preset.
 * Never attaches api_key, api_secret, signature, timestamp, or transformation fields.
 *
 * @param {File} file
 * @param {{
 *   folder?: string,
 *   resourceType?: 'image' | 'video' | 'auto' | 'raw',
 *   uploadPreset?: string,
 *   cloudName?: string,
 * }} [options]
 * @returns {Promise<{ secure_url: string, public_id: string, resource_type: string }>}
 */
export async function uploadToCloudinary(file, options = {}) {
  if (!file || file.size === 0) {
    throw new Error('Please select a valid, non-empty file to upload.');
  }

  const cloudName = String(
    options.cloudName ||
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
      'gwz68wfo',
  ).trim();
  const uploadPreset = String(
    options.uploadPreset ||
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
      'clouskee_unsigned',
  ).trim();
  const resourceType =
    options.resourceType || detectCloudinaryResourceType(file);

  const maxBytes =
    resourceType === 'image' ? 25 * 1024 * 1024 : 100 * 1024 * 1024;
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    throw new Error(`File exceeds ${maxMb}MB limit. Choose a smaller file.`);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${encodeURIComponent(resourceType)}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (options.folder && String(options.folder).trim()) {
    formData.append('folder', String(options.folder).trim());
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body?.error?.message || `Cloudinary upload failed (${response.status})`,
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!payload?.secure_url) {
    throw new Error(
      'Cloudinary upload failed: response did not include a media URL.',
    );
  }

  return {
    secure_url: sanitizeCloudinaryMediaUrl(payload.secure_url),
    public_id: (payload.public_id || '').replace(TRAILING_ASSET_EXT_RE, ''),
    resource_type: payload.resource_type || resourceType,
  };
}

/**
 * Parse a Cloudinary delivery URL into cloudName, resourceType, extension, and extension-free publicId.
 * Returns null for non-Cloudinary URLs or raw cursor/vector assets that shouldn't be re-transformed.
 *
 * @param {string | null | undefined} url
 * @returns {{ cloudName: string, resourceType: 'image' | 'video', publicId: string, extension: string } | null}
 */
export function parseCloudinaryAsset(url) {
  const normalizedUrl = sanitizeCloudinaryMediaUrl(url);
  if (!normalizedUrl) return null;

  let parsed;
  try {
    parsed = new URL(normalizedUrl);
  } catch {
    return null;
  }

  if (parsed.hostname !== 'res.cloudinary.com') return null;
  if (NON_TRANSFORMABLE_EXT_RE.test(parsed.pathname)) return null;

  const segments = parsed.pathname.split('/').filter(Boolean);
  // Format: /<cloudName>/<resourceType>/upload/[transformations/][v12345/]<publicId...>
  if (segments.length < 4) return null;

  const [cloudName, resourceType, deliveryType, ...rest] = segments;
  if (
    deliveryType !== 'upload' ||
    (resourceType !== 'image' && resourceType !== 'video')
  ) {
    return null;
  }

  const versionIdx = rest.findIndex((seg) => /^v\d+$/.test(seg));
  const publicParts = versionIdx >= 0 ? rest.slice(versionIdx + 1) : rest;
  if (publicParts.length === 0) return null;

  const decodedPath = decodeURIComponent(publicParts.join('/'));
  const extMatch = decodedPath.match(TRAILING_ASSET_EXT_RE);
  const extension = extMatch ? extMatch[1].toLowerCase() : '';
  const publicId = decodedPath.replace(TRAILING_ASSET_EXT_RE, '');
  if (!publicId) return null;

  return {
    cloudName,
    resourceType,
    publicId,
    extension,
  };
}

/**
 * Returns clean single-extension video source descriptors for @cloudinary/react <AdvancedVideo>
 * so HtmlVideoLayer never appends `.mp4` onto an already-extensioned URL.
 *
 * @param {string | null | undefined} url
 * @returns {Array<{ type: string }>}
 */
export function getCloudinaryVideoSources(url) {
  const asset = parseCloudinaryAsset(url);
  const ext = asset?.extension;
  if (ext === 'webm') {
    return [{type: 'webm'}, {type: 'mp4'}];
  }
  return [{type: 'mp4'}];
}

/**
 * Build an optimized @cloudinary/url-gen CloudinaryImage when given a Cloudinary image URL.
 *
 * @param {string | null | undefined} url
 * @param {{ width?: number, height?: number }} [options]
 */
export function buildCloudinaryImage(url, options = {}) {
  const asset = parseCloudinaryAsset(url);
  if (!asset || asset.resourceType !== 'image') return null;

  const client =
    asset.cloudName === CLOUDINARY_CLOUD_NAME
      ? cloudinaryClient
      : new Cloudinary({cloud: {cloudName: asset.cloudName}});

  const img = client
    .image(asset.publicId)
    .delivery(format('auto'))
    .delivery(quality('auto'));

  if (options.width && options.height) {
    img.resize(fill().width(options.width).height(options.height));
  }

  return img;
}

/**
 * Build an optimized @cloudinary/url-gen CloudinaryVideo when given a Cloudinary video URL.
 *
 * @param {string | null | undefined} url
 */
export function buildCloudinaryVideo(url) {
  const asset = parseCloudinaryAsset(url);
  if (!asset || asset.resourceType !== 'video') return null;

  const client =
    asset.cloudName === CLOUDINARY_CLOUD_NAME
      ? cloudinaryClient
      : new Cloudinary({cloud: {cloudName: asset.cloudName}});

  return client.video(asset.publicId).delivery(quality('auto'));
}

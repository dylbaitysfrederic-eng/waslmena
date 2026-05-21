import { Buffer } from 'node:buffer';

import { put } from '@vercel/blob';
import sharp from 'sharp';

const MAX_UPLOAD_BYTES = 5_000_000;
const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1920;
const WEBP_QUALITY = 78;
const AVIF_QUALITY = 58;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/webp',
]);

export type WelcomeScreenImageResult = {
  accentColor: string;
  avifUrl: string;
  imageUrl: string;
};

const toHexColor = (red: number, green: number, blue: number) => {
  const channelToHex = (channel: number) => (
    Math.max(0, Math.min(255, Math.round(channel)))
      .toString(16)
      .padStart(2, '0')
  );

  return `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`;
};

export const saveWelcomeScreenImageFile = async (
  organizationId: string,
  file: File,
): Promise<WelcomeScreenImageResult> => {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('invalid_welcome_image_type');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('welcome_image_too_large');
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(inputBuffer, {
    animated: false,
    limitInputPixels: 24_000_000,
  }).rotate();
  const stats = await image.clone().stats();
  const optimizedImage = image
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    });
  const [webpBuffer, avifBuffer] = await Promise.all([
    optimizedImage.clone().webp({ quality: WEBP_QUALITY }).toBuffer(),
    optimizedImage.clone().avif({ quality: AVIF_QUALITY }).toBuffer(),
  ]);
  const fileBaseName = `welcome-screens/${encodeURIComponent(organizationId)}/${crypto.randomUUID()}`;
  const [webpBlob, avifBlob] = await Promise.all([
    put(`${fileBaseName}.webp`, webpBuffer, {
      access: 'public',
      contentType: 'image/webp',
    }),
    put(`${fileBaseName}.avif`, avifBuffer, {
      access: 'public',
      contentType: 'image/avif',
    }),
  ]);

  return {
    accentColor: toHexColor(
      stats.dominant.r,
      stats.dominant.g,
      stats.dominant.b,
    ),
    avifUrl: avifBlob.url,
    imageUrl: webpBlob.url,
  };
};

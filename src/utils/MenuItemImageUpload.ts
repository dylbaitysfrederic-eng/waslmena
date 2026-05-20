import { put } from '@vercel/blob';

const MAX_UPLOAD_BYTES = 300_000;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export type MenuItemImageUploadError = 'invalid_image_type' | 'image_too_large';

export const saveMenuItemImageFile = async (
  organizationId: string,
  file: File,
): Promise<string> => {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('invalid_image_type');
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('image_too_large');
  }

  const extension = EXTENSION_BY_MIME_TYPE[file.type] ?? '.jpg';
  const fileName = `menu-items/${encodeURIComponent(organizationId)}/${crypto.randomUUID()}${extension}`;

  const blob = await put(fileName, file, {
    access: 'public',
    contentType: file.type,
  });

  return blob.url;
};

export const getMenuItemImageUrl = async (
  organizationId: string,
  imageUrl: string | null,
  imageFileValue: FormDataEntryValue | null,
): Promise<string | null> => {
  const imageFile = imageFileValue as File | undefined;

  if (imageFile && imageFile.size > 0 && typeof imageFile.arrayBuffer === 'function') {
    return await saveMenuItemImageFile(organizationId, imageFile);
  }

  return imageUrl || null;
};

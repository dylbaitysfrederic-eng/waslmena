import { put } from '@vercel/blob';

const MAX_UPLOAD_BYTES = 300_000;
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);
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

export type MenuItemImageUploadError =
  | 'image_too_large'
  | 'invalid_image_type'
  | 'upload_failed';

const getFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf('.');

  return lastDotIndex === -1 ? '' : fileName.slice(lastDotIndex).toLowerCase();
};

export const saveMenuItemImageFile = async (
  organizationId: string,
  file: File,
): Promise<string> => {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new Error('invalid_image_type');
  }

  const extension = getFileExtension(file.name);

  if (
    !ALLOWED_IMAGE_MIME_TYPES.has(file.type)
    || !ALLOWED_IMAGE_EXTENSIONS.has(extension)
  ) {
    throw new Error('invalid_image_type');
  }

  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new Error('image_too_large');
  }

  const storageExtension = EXTENSION_BY_MIME_TYPE[file.type] ?? '.jpg';
  const fileName = `menu-items/${encodeURIComponent(organizationId)}/${crypto.randomUUID()}${storageExtension}`;

  try {
    const blob = await put(fileName, file, {
      access: 'public',
      contentType: file.type,
    });

    return blob.url;
  } catch {
    throw new Error('upload_failed');
  }
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

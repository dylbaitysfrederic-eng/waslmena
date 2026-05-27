'use client';

import { useEffect, useState } from 'react';

import { MenuItemImagePreview } from '@/components/MenuItemImagePreview';
import { Label } from '@/components/ui/label';

const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.webp';
const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_UPLOAD_KB = 300;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_KB * 1000;

type MenuItemImageUploadFieldProps = {
  fieldId: string;
  urlFieldName: string;
  fileFieldName: string;
  label: string;
  helpText: string;
  placeholder?: string;
  currentImageUrl?: string | null;
};

export const MenuItemImageUploadField = ({
  fieldId,
  urlFieldName: _urlFieldName,
  fileFieldName,
  label,
  helpText,
  placeholder: _placeholder,
  currentImageUrl,
}: MenuItemImageUploadFieldProps) => {
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [validationError, setValidationError] = useState('');
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName('');
      setSelectedFileSize(null);
      setValidationError('');
      setLocalPreviewUrl(null);
      return;
    }

    if (!ACCEPTED_MIME_TYPES.has(file.type)) {
      event.target.value = '';
      setSelectedFileName('');
      setSelectedFileSize(null);
      setValidationError('Upload JPG, JPEG, PNG or WEBP only.');
      setLocalPreviewUrl(null);
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      event.target.value = '';
      setSelectedFileName('');
      setSelectedFileSize(null);
      setValidationError(`Upload an image up to ${MAX_UPLOAD_KB} KB.`);
      setLocalPreviewUrl(null);
      return;
    }

    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    setValidationError('');
    setLocalPreviewUrl(URL.createObjectURL(file));
  };

  const previewUrl = localPreviewUrl || currentImageUrl || null;

  return (
    <div className="space-y-2">
      <Label htmlFor={`${fieldId}-file`}>{label}</Label>
      <p className="text-xs text-muted-foreground">{helpText}</p>
      <input
        id={`${fieldId}-file`}
        name={fileFieldName}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleFileChange}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <p className="text-xs text-muted-foreground">
        Upload JPG, JPEG, PNG or WEBP up to
        {' '}
        {MAX_UPLOAD_KB}
        {' '}
        KB. Uploading a new file replaces the current image.
      </p>
      {validationError && (
        <p className="text-xs font-medium text-destructive">{validationError}</p>
      )}
      {selectedFileName && (
        <p className="text-xs text-muted-foreground">
          Selected file:
          {' '}
          {selectedFileName}
          {' '}
          (
          {Math.round((selectedFileSize ?? 0) / 1024)}
          KB)
        </p>
      )}
      {previewUrl && (
        <div className="overflow-hidden rounded-md border bg-muted p-2">
          <MenuItemImagePreview
            src={previewUrl}
            alt={label}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

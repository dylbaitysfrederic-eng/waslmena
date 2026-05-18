'use client';

import { useEffect, useState } from 'react';

import { MenuItemImagePreview } from '@/components/MenuItemImagePreview';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.webp';
const MAX_UPLOAD_KB = 300;

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
  urlFieldName,
  fileFieldName,
  label,
  helpText,
  placeholder,
  currentImageUrl,
}: MenuItemImageUploadFieldProps) => {
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
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
      setLocalPreviewUrl(null);
      return;
    }

    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    setLocalPreviewUrl(URL.createObjectURL(file));
  };

  const previewUrl = localPreviewUrl || currentImageUrl || null;

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <p className="text-xs text-muted-foreground">{helpText}</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          id={fieldId}
          name={urlFieldName}
          type="url"
          placeholder={placeholder}
        />
        <label className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm text-foreground">
          <span className="truncate">Choose file</span>
          <input
            id={`${fieldId}-file`}
            name={fileFieldName}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
            className="ml-3 block size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Upload JPG, JPEG, PNG or WEBP up to
        {MAX_UPLOAD_KB}
        KB. Uploaded file overrides the image URL.
      </p>
      {selectedFileName && (
        <p className="text-xs text-muted-foreground">
          Selected file:
          {selectedFileName}
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

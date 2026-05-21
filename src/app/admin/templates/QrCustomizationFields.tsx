'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { useState } from 'react';

import { SwitchField } from '@/components/SwitchField';

const QR_STYLE_TEMPLATES = ['classic', 'modern', 'minimal'] as const;

type QrCustomizationFieldsProps = {
  defaultBackgroundColor?: string;
  defaultForegroundColor?: string;
  defaultFrameColor?: string;
  defaultLabelText?: string | null;
  defaultLogoUrl?: string | null;
  defaultShowRestaurantName?: boolean;
  defaultShowTableNumber?: boolean;
  defaultStyleTemplate?: string | null;
  organizationId: string;
  restaurantName: string;
};

const normalizeHexColor = (value: string) => {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#111827';
};

const getRelativeLuminance = (hexColor: string) => {
  const normalizedColor = normalizeHexColor(hexColor).slice(1);
  const channels = [0, 2, 4].map((startIndex) => {
    const channel = Number.parseInt(
      normalizedColor.slice(startIndex, startIndex + 2),
      16,
    ) / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
};

const getContrastRatio = (firstColor: string, secondColor: string) => {
  const firstLuminance = getRelativeLuminance(firstColor);
  const secondLuminance = getRelativeLuminance(secondColor);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

export const QrCustomizationFields = ({
  defaultBackgroundColor = '#ffffff',
  defaultForegroundColor = '#111827',
  defaultFrameColor = '#111827',
  defaultLabelText,
  defaultLogoUrl,
  defaultShowRestaurantName = true,
  defaultShowTableNumber = true,
  defaultStyleTemplate,
  organizationId,
  restaurantName,
}: QrCustomizationFieldsProps) => {
  const initialStyleTemplate = QR_STYLE_TEMPLATES.includes(
    defaultStyleTemplate as (typeof QR_STYLE_TEMPLATES)[number],
  )
    ? defaultStyleTemplate!
    : 'classic';
  const [frameColor, setFrameColor] = useState(defaultFrameColor);
  const [foregroundColor, setForegroundColor] = useState(defaultForegroundColor);
  const [backgroundColor, setBackgroundColor] = useState(defaultBackgroundColor);
  const [labelText, setLabelText] = useState(defaultLabelText ?? 'Scan to order');
  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl ?? '');
  const [showRestaurantName, setShowRestaurantName] = useState(
    defaultShowRestaurantName,
  );
  const [showTableNumber, setShowTableNumber] = useState(defaultShowTableNumber);
  const [styleTemplate, setStyleTemplate] = useState(initialStyleTemplate);
  const contrastRatio = getContrastRatio(foregroundColor, backgroundColor);
  const hasLowContrast = contrastRatio < 4.5;
  const frameClassName = {
    classic: 'rounded-md border-4',
    modern: 'rounded-md border-4 shadow-sm',
    minimal: 'rounded-md border',
  }[styleTemplate] ?? 'rounded-md border-4';

  return (
    <div className="grid gap-4 rounded-md border bg-muted/30 p-4 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="grid gap-4">
        <div>
          <h4 className="font-semibold text-foreground">QR appearance</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Keep the QR foreground dark and the background light. Too much
            customization or low contrast can make QR codes harder to scan.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <label
            htmlFor={`qr-frame-color-${organizationId}`}
            className="grid gap-1 text-xs font-medium text-muted-foreground"
          >
            Frame color
            <input
              id={`qr-frame-color-${organizationId}`}
              name="qrFrameColor"
              type="color"
              value={frameColor}
              onChange={event => setFrameColor(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background p-1"
            />
          </label>

          <label
            htmlFor={`qr-foreground-color-${organizationId}`}
            className="grid gap-1 text-xs font-medium text-muted-foreground"
          >
            QR foreground
            <input
              id={`qr-foreground-color-${organizationId}`}
              name="qrForegroundColor"
              type="color"
              value={foregroundColor}
              onChange={event => setForegroundColor(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background p-1"
            />
          </label>

          <label
            htmlFor={`qr-background-color-${organizationId}`}
            className="grid gap-1 text-xs font-medium text-muted-foreground"
          >
            QR background
            <input
              id={`qr-background-color-${organizationId}`}
              name="qrBackgroundColor"
              type="color"
              value={backgroundColor}
              onChange={event => setBackgroundColor(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background p-1"
            />
          </label>

          <label
            htmlFor={`qr-style-template-${organizationId}`}
            className="grid gap-1 text-xs font-medium text-muted-foreground"
          >
            Style template
            <select
              id={`qr-style-template-${organizationId}`}
              name="qrStyleTemplate"
              value={styleTemplate}
              onChange={event => setStyleTemplate(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {QR_STYLE_TEMPLATES.map(template => (
                <option key={template} value={template}>
                  {template.charAt(0).toUpperCase() + template.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label
            htmlFor={`qr-label-text-${organizationId}`}
            className="grid gap-1 text-xs font-medium text-muted-foreground"
          >
            Label text
            <input
              id={`qr-label-text-${organizationId}`}
              name="qrLabelText"
              type="text"
              value={labelText}
              onChange={event => setLabelText(event.target.value)}
              placeholder="Scan to order"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </label>

          <label
            htmlFor={`qr-logo-url-${organizationId}`}
            className="grid gap-1 text-xs font-medium text-muted-foreground"
          >
            Logo/image URL
            <input
              id={`qr-logo-url-${organizationId}`}
              name="restaurantLogoUrl"
              type="url"
              value={logoUrl}
              onChange={event => setLogoUrl(event.target.value)}
              placeholder="https://example.com/logo.png"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SwitchField
            id={`qr-show-restaurant-name-${organizationId}`}
            name="qrShowRestaurantName"
            label="Show restaurant name"
            description="Print the restaurant name above the QR."
            defaultChecked={defaultShowRestaurantName}
            onChange={event => setShowRestaurantName(event.target.checked)}
          />
          <SwitchField
            id={`qr-show-table-number-${organizationId}`}
            name="qrShowTableNumber"
            label="Show table number"
            description="Print the table number below the QR."
            defaultChecked={defaultShowTableNumber}
            onChange={event => setShowTableNumber(event.target.checked)}
          />
        </div>

        {hasLowContrast && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-950">
            QR foreground/background contrast is low. Saving will force the QR
            code back to dark-on-light for scan reliability.
          </div>
        )}
      </div>

      <div className="grid place-items-center rounded-md bg-background p-4">
        <div
          className={`${frameClassName} grid w-44 gap-2 p-3 text-center`}
          style={{ borderColor: frameColor, backgroundColor }}
        >
          {showRestaurantName && (
            <div className="text-sm font-semibold" style={{ color: frameColor }}>
              {restaurantName}
            </div>
          )}
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="mx-auto size-10 rounded-md object-contain"
            />
          )}
          <QRCodeCanvas
            value="https://waslmena.com/menu-preview"
            size={132}
            marginSize={2}
            fgColor={hasLowContrast ? '#111827' : foregroundColor}
            bgColor={hasLowContrast ? '#ffffff' : backgroundColor}
            level={logoUrl ? 'H' : 'M'}
          />
          {labelText && (
            <div className="text-xs font-medium" style={{ color: frameColor }}>
              {labelText}
            </div>
          )}
          {showTableNumber && (
            <div className="text-xs font-semibold" style={{ color: frameColor }}>
              Table 12
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import { Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

type TableQrCodeProps = {
  backgroundColor: string;
  publicMenuUrl: string;
  foregroundColor: string;
  frameColor: string;
  labelText: string | null;
  logoUrl: string | null;
  restaurantName: string;
  showRestaurantName: boolean;
  showTableNumber: boolean;
  styleTemplate: string;
  tableNumber: number | null;
  downloadLabel: string;
  downloadFileName: string;
  qrCodeTitle: string;
};

export const TableQrCode = (props: TableQrCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCodeValue, setQrCodeValue] = useState(props.publicMenuUrl);

  useEffect(() => {
    setQrCodeValue(new URL(props.publicMenuUrl, window.location.origin).href);
  }, [props.publicMenuUrl]);

  const createDownloadLink = (dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = props.downloadFileName;
    link.click();
  };

  const loadLogoImage = async () => {
    if (!props.logoUrl) {
      return null;
    }

    return new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = props.logoUrl ?? '';
    });
  };

  const downloadQrCode = async () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const logoImage = await loadLogoImage();
    const renderComposedCanvas = (logo: HTMLImageElement | null) => {
      const framePadding = props.styleTemplate === 'minimal' ? 24 : 32;
      const qrSize = canvas.width;
      const logoBlockHeight = logo ? 44 : 0;
      const labelLines = [
        props.showRestaurantName ? props.restaurantName : null,
        props.labelText,
        props.showTableNumber && props.tableNumber !== null
          ? `Table ${props.tableNumber}`
          : null,
      ].filter((line): line is string => Boolean(line));
      const labelHeight = labelLines.length * 28;
      const composedCanvas = document.createElement('canvas');
      composedCanvas.width = qrSize + framePadding * 2;
      composedCanvas.height = qrSize + framePadding * 2 + logoBlockHeight + labelHeight;

      const context = composedCanvas.getContext('2d');

      if (!context) {
        return null;
      }

      context.fillStyle = props.backgroundColor;
      context.fillRect(0, 0, composedCanvas.width, composedCanvas.height);
      context.strokeStyle = props.frameColor;
      context.lineWidth = props.styleTemplate === 'minimal' ? 2 : 8;
      context.strokeRect(
        context.lineWidth / 2,
        context.lineWidth / 2,
        composedCanvas.width - context.lineWidth,
        composedCanvas.height - context.lineWidth,
      );

      if (logo) {
        context.drawImage(
          logo,
          composedCanvas.width / 2 - 18,
          framePadding,
          36,
          36,
        );
      }

      const qrTop = framePadding + logoBlockHeight;
      context.drawImage(canvas, framePadding, qrTop);
      context.fillStyle = props.frameColor;
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      labelLines.forEach((line, index) => {
        context.font = index === 0 ? '700 18px sans-serif' : '600 15px sans-serif';
        context.fillText(
          line,
          composedCanvas.width / 2,
          qrTop + qrSize + 16 + index * 28,
        );
      });

      return composedCanvas;
    };

    try {
      const composedCanvas = renderComposedCanvas(logoImage);

      if (composedCanvas) {
        createDownloadLink(composedCanvas.toDataURL('image/png'));
        return;
      }
    } catch {
      // Retry without the remote logo if the image is not safe for canvas export.
    }

    const fallbackCanvas = renderComposedCanvas(null);

    if (fallbackCanvas) {
      createDownloadLink(fallbackCanvas.toDataURL('image/png'));
    }
  };

  const frameClassName = {
    classic: 'rounded-md border-4',
    modern: 'rounded-xl border-4 shadow-md',
    minimal: 'rounded-md border',
  }[props.styleTemplate] ?? 'rounded-md border-4';

  return (
    <div className="flex w-44 flex-col items-center gap-2">
      <div
        className={`${frameClassName} grid w-full place-items-center gap-2 p-3 text-center`}
        style={{
          backgroundColor: props.backgroundColor,
          borderColor: props.frameColor,
        }}
      >
        {props.showRestaurantName && (
          <div className="text-sm font-semibold" style={{ color: props.frameColor }}>
            {props.restaurantName}
          </div>
        )}
        {props.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.logoUrl}
            alt=""
            className="size-9 rounded-md object-contain"
          />
        )}
        <QRCodeCanvas
          ref={canvasRef}
          value={qrCodeValue}
          size={112}
          marginSize={2}
          fgColor={props.foregroundColor}
          bgColor={props.backgroundColor}
          title={props.qrCodeTitle}
          level={props.logoUrl ? 'H' : 'M'}
        />
        {props.labelText && (
          <div className="text-xs font-medium" style={{ color: props.frameColor }}>
            {props.labelText}
          </div>
        )}
        {props.showTableNumber && props.tableNumber !== null && (
          <div className="text-xs font-semibold" style={{ color: props.frameColor }}>
            Table
            {' '}
            {props.tableNumber}
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={downloadQrCode}
        className="w-full gap-2"
      >
        <Download className="size-4" aria-hidden="true" />
        {props.downloadLabel}
      </Button>
    </div>
  );
};

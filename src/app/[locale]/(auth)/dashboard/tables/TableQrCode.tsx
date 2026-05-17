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
  restaurantName: string;
  showRestaurantName: boolean;
  showTableNumber: boolean;
  styleTemplate: string;
  tableNumber: number;
  downloadLabel: string;
  qrCodeTitle: string;
};

export const TableQrCode = (props: TableQrCodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCodeValue, setQrCodeValue] = useState(props.publicMenuUrl);

  useEffect(() => {
    setQrCodeValue(new URL(props.publicMenuUrl, window.location.origin).href);
  }, [props.publicMenuUrl]);

  const downloadQrCode = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const framePadding = props.styleTemplate === 'minimal' ? 24 : 32;
    const qrSize = canvas.width;
    const labelLines = [
      props.showRestaurantName ? props.restaurantName : null,
      props.labelText,
      props.showTableNumber ? `Table ${props.tableNumber}` : null,
    ].filter((line): line is string => Boolean(line));
    const labelHeight = labelLines.length * 28;
    const composedCanvas = document.createElement('canvas');
    composedCanvas.width = qrSize + framePadding * 2;
    composedCanvas.height = qrSize + framePadding * 2 + labelHeight;

    const context = composedCanvas.getContext('2d');

    if (!context) {
      return;
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

    context.drawImage(canvas, framePadding, framePadding);
    context.fillStyle = props.frameColor;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    labelLines.forEach((line, index) => {
      context.font = index === 0 ? '700 18px sans-serif' : '600 15px sans-serif';
      context.fillText(
        line,
        composedCanvas.width / 2,
        framePadding + qrSize + 16 + index * 28,
      );
    });

    const link = document.createElement('a');
    link.href = composedCanvas.toDataURL('image/png');
    link.download = `table-${props.tableNumber}-menu-qr.png`;
    link.click();
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
        <QRCodeCanvas
          ref={canvasRef}
          value={qrCodeValue}
          size={112}
          marginSize={2}
          level="M"
          fgColor={props.foregroundColor}
          bgColor={props.backgroundColor}
          title={props.qrCodeTitle}
        />
        {props.labelText && (
          <div className="text-xs font-medium" style={{ color: props.frameColor }}>
            {props.labelText}
          </div>
        )}
        {props.showTableNumber && (
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

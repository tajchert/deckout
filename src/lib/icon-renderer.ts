import type { IconConfig } from './types';

const ICON_SIZE = 288;
const CORNER_RADIUS = 40;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export async function renderIconToBlob(icon: IconConfig): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Background with rounded corners
  roundRect(ctx, 0, 0, ICON_SIZE, ICON_SIZE, CORNER_RADIUS);
  ctx.fillStyle = icon.bgColor || '#1a1a1a';
  ctx.fill();
  ctx.clip();

  // Image layer
  if (icon.imageDataUrl) {
    const img = await loadImage(icon.imageDataUrl);
    // Cover-fit: scale to fill, center crop
    const scale = Math.max(ICON_SIZE / img.width, ICON_SIZE / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (ICON_SIZE - w) / 2, (ICON_SIZE - h) / 2, w, h);
  }

  // Emoji layer
  if (icon.emoji) {
    ctx.font = `${ICON_SIZE * 0.55}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon.emoji, ICON_SIZE / 2, ICON_SIZE / 2 + ICON_SIZE * 0.03);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function renderIconPreviewUrl(icon: IconConfig): string | null {
  if (!icon.emoji && !icon.imageDataUrl && icon.bgColor === '#1a1a1a') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 72;
  canvas.height = 72;
  const ctx = canvas.getContext('2d')!;

  roundRect(ctx, 0, 0, 72, 72, 10);
  ctx.fillStyle = icon.bgColor || '#1a1a1a';
  ctx.fill();
  ctx.clip();

  if (icon.emoji) {
    ctx.font = '36px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon.emoji, 36, 38);
  }

  return canvas.toDataURL('image/png');
}

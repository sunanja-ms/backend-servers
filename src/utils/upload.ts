import sharp from 'sharp';
import { AppError } from '../types/errors.js';

interface ProcessOptions {
  maxWidth?: number;
  square?: boolean;
}

/**
 * Validate and re-encode an uploaded image. Decoding is what proves the bytes are
 * really an image, so a disguised payload (HTML/JS in a .jpg) is rejected here.
 * Re-encoding also drops EXIF and any appended data.
 */
export async function processImage(input: Buffer, options: ProcessOptions = {}): Promise<Buffer> {
  const { maxWidth = 1200, square = false } = options;

  try {
    const image = sharp(input, { failOn: 'error', limitInputPixels: 40_000_000 }).rotate();
    const resized = square
      ? image.resize(maxWidth, maxWidth, { fit: 'cover', position: 'centre' })
      : image.resize({ width: maxWidth, height: maxWidth, fit: 'inside', withoutEnlargement: true });

    return await resized.webp({ quality: 82 }).toBuffer();
  } catch {
    throw AppError.badRequest('Invalid or corrupt image');
  }
}

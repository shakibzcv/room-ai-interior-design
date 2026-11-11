import puter from '@heyputer/puter.js';
import { ROOM_AI_RENDER_PROMPT } from './constants';

export const fetchAsDataUrl = async (url: string): Promise<string> => {
  const parsedUrl = new URL(url);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only http and https protocols are allowed');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {
  const dataUrl = sourceImage.startsWith('data:') ? sourceImage : await fetchAsDataUrl(sourceImage);

  const base64Data = dataUrl.split(',')[1];
  const mimeType = dataUrl.split(';')[0].split(':')[1];

  if (!mimeType || !base64Data) throw new Error('Invalid source image payload');

  const response = await puter.ai.txt2img(ROOM_AI_RENDER_PROMPT, {
    provider: 'gemini',
    model: 'gemini-2.5-flash-image-preview',
    input_image: base64Data,
    input_image_mime_type: mimeType,
    ratio: { w: 1024, h: 1024 },
  });

  // Safe type check for response
  const rawImageUrl =
    typeof response === 'object' && response !== null && 'src' in response
      ? (response as { src: string }).src
      : null;

  if (!rawImageUrl) return { renderedImage: null, renderedPath: undefined };

  const renderedImage = rawImageUrl.startsWith('data:')
    ? rawImageUrl
    : await fetchAsDataUrl(rawImageUrl);

  return { renderedImage, renderedPath: undefined };
};

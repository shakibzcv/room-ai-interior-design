import puter from '@heyputer/puter.js';
import { ROOM_AI_RENDER_PROMPT } from './constants';

export const fetchAsDataUrl = async (url: string): Promise<string> => {
  // blob: URLs are created locally by the SDK — fetch them directly without protocol check
  if (!url.startsWith('blob:')) {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only http and https protocols are allowed');
    }
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
  console.log('[RoomAI] Preparing source image for generation...');
  const dataUrl = sourceImage.startsWith('data:') ? sourceImage : await fetchAsDataUrl(sourceImage);

  const base64Data = dataUrl.split(',')[1];
  const mimeType = dataUrl.split(';')[0].split(':')[1];

  if (!mimeType || !base64Data) throw new Error('Invalid source image payload');

  // Ensure user is signed in so Puter does not silently block on modal
  if (!puter.auth.isSignedIn()) {
    console.log('[RoomAI] User not authenticated in Puter, requesting sign-in...');
    try {
      await puter.auth.signIn();
    } catch {
      throw new Error('Puter authentication is required to generate 3D views. Please sign in and try again.');
    }
  }

  console.log('[RoomAI] Calling puter.ai.txt2img with gemini-3.1-flash-image...');

  // 90s safety timeout to prevent permanent UI lock
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Image generation timed out after 90 seconds. Please check your Puter account and try again.'));
    }, 90000);
  });

  const response = await Promise.race([
    puter.ai.txt2img(ROOM_AI_RENDER_PROMPT, {
      model: 'gemini-3.1-flash-image',
      input_image: base64Data,
      input_image_mime_type: mimeType,
    }),
    timeoutPromise,
  ]);

  console.log('[RoomAI] puter.ai.txt2img responded:', response);

  // The SDK transform returns an Image element (or plain Object in non-DOM env)
  // with .src set to a data/blob URL. So response.src is the right field.
  const rawImageUrl =
    response && typeof response === 'object' && 'src' in response
      ? (response as { src: string }).src
      : typeof response === 'string'
        ? response
        : null;

  if (!rawImageUrl) return { renderedImage: null, renderedPath: undefined };

  const renderedImage = rawImageUrl.startsWith('data:')
    ? rawImageUrl
    : await fetchAsDataUrl(rawImageUrl);

  console.log('[RoomAI] Rendered image successfully converted to data URL');
  return { renderedImage, renderedPath: undefined };
};

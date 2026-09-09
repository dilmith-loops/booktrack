/**
 * Sampath AI Client-Side Image Safety Shield
 * Strict pre-filtering against excessive skin exposure, swimwear, bikinis,
 * lingerie, vulgarity, and policy-violating imagery.
 * 
 * Enforces Google Play / Web Family Safety Policies.
 */

export interface ImageSafetyResult {
  isClean: boolean;
  skinPercentage: number;
  reason?: string;
}

/**
 * Evaluates whether a pixel corresponds to human skin tone across diverse ethnicities
 * Using standard dual-space RGB and YCbCr color bounding boxes.
 */
function isSkinTone(r: number, g: number, b: number): boolean {
  if (r <= 95 || g <= 40 || b <= 20) {
    return false;
  }

  if (r - g < 15 || r - b < 15) {
    return false;
  }

  // YCbCr heuristic (Chai & Ngan color cluster)
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  // Human skin tone in YCbCr requires Cb in [77, 125], Cr in [135, 173] AND distinct reddish bias (Cr - Cb >= 12)
  return cb >= 77 && cb <= 125 && cr >= 135 && cr <= 173 && cr - cb >= 12;
}

/**
 * Analyzes an image data URL or blob using an offscreen HTML5 canvas.
 * Computes the ratio of exposed skin pixels overall and in the central torso zone.
 */
export async function analyzeImageClientSafety(dataUrl: string): Promise<ImageSafetyResult> {
  return new Promise((resolve) => {
    // If it's not a data URL or image, let it pass to server moderation
    if (!dataUrl.startsWith('data:image/')) {
      resolve({ isClean: true, skinPercentage: 0 });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const SAMPLE_SIZE = 120;
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve({ isClean: true, skinPercentage: 0 });
          return;
        }

        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const imgData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const data = imgData.data;

        let totalPixels = 0;
        let skinPixels = 0;

        let centralTotalPixels = 0;
        let centralSkinPixels = 0;

        const startY = Math.floor(SAMPLE_SIZE * 0.2);
        const endY = Math.floor(SAMPLE_SIZE * 0.8);
        const startX = Math.floor(SAMPLE_SIZE * 0.2);
        const endX = Math.floor(SAMPLE_SIZE * 0.8);

        for (let y = 0; y < SAMPLE_SIZE; y++) {
          for (let x = 0; x < SAMPLE_SIZE; x++) {
            const index = (y * SAMPLE_SIZE + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            // Ignore transparent pixels
            if (a < 128) continue;

            totalPixels++;
            const isSkin = isSkinTone(r, g, b);

            if (isSkin) {
              skinPixels++;
            }

            // Central / Torso region analysis
            if (y >= startY && y <= endY && x >= startX && x <= endX) {
              centralTotalPixels++;
              if (isSkin) {
                centralSkinPixels++;
              }
            }
          }
        }

        if (totalPixels === 0) {
          resolve({ isClean: true, skinPercentage: 0 });
          return;
        }

        const skinRatio = skinPixels / totalPixels;
        const centralRatio = centralTotalPixels > 0 ? centralSkinPixels / centralTotalPixels : 0;
        const skinPercentage = Math.round(skinRatio * 100);

        // Strict thresholds:
        // - Book covers, pages, and stalls have < 6% skin pixels.
        // - Swimwear, bikinis, lingerie, shirtless, or revealing photos have 15% - 60%+ skin pixels.
        // - If overall skin ratio >= 14% or central torso skin ratio >= 12%: BLOCK
        if (skinRatio >= 0.14 || centralRatio >= 0.12) {
          resolve({
            isClean: false,
            skinPercentage,
            reason: `Excessive skin exposure (${skinPercentage}%) or swimwear/revealing attire detected. Strictly prohibited under Google Safety and Sampath Book Finder policies. Please only upload photos of books or book fair stalls.`
          });
          return;
        }

        resolve({
          isClean: true,
          skinPercentage
        });
      } catch (e) {
        // Fallback to server verification
        resolve({ isClean: true, skinPercentage: 0 });
      }
    };

    img.onerror = () => {
      resolve({ isClean: true, skinPercentage: 0 });
    };

    img.src = dataUrl;
  });
}

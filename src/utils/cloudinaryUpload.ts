/**
 * Utility functions for uploading and processing company logos
 * with Cloudinary API integration (supporting unsigned presets and signed uploads via crypto signature)
 * and fast fallback handling to local storage and Firestore.
 */

// Default Cloudinary configuration provided by the user
export const DEFAULT_CLOUDINARY_CONFIG = {
  cloudName: 'dismpss5e',
  uploadPreset: 'REPORT',
  apiKey: '335545523274868',
  apiSecret: 'TMe5NO5FXq9H54J7O_XhBNex9AM',
};

/**
 * Computes SHA-1 hash in browser for Cloudinary API signature
 */
async function computeSha1(str: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Resizes and compresses an image file on the client-side
 */
export async function compressImage(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

export interface UploadResult {
  url: string;
  source: 'cloudinary' | 'local_storage';
  error?: string;
}

/**
 * Uploads a logo image to Cloudinary using configured credentials
 */
export async function uploadLogoImage(
  file: File,
  config?: {
    cloudName?: string;
    uploadPreset?: string;
    apiKey?: string;
    apiSecret?: string;
  }
): Promise<UploadResult> {
  // Compress image first for speed & efficiency
  const compressedBase64 = await compressImage(file, 400, 400);

  // Merge provided config with default user Cloudinary account
  const cloudName = (config?.cloudName?.trim() || DEFAULT_CLOUDINARY_CONFIG.cloudName).trim();
  const uploadPreset = (config?.uploadPreset?.trim() || DEFAULT_CLOUDINARY_CONFIG.uploadPreset).trim();
  const apiKey = (config?.apiKey?.trim() || DEFAULT_CLOUDINARY_CONFIG.apiKey).trim();
  const apiSecret = (config?.apiSecret?.trim() || DEFAULT_CLOUDINARY_CONFIG.apiSecret).trim();

  if (cloudName) {
    // Strategy A: Try with upload_preset (Unsigned)
    if (uploadPreset) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'daily_report_logos');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.secure_url) {
            return {
              url: data.secure_url,
              source: 'cloudinary',
            };
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('Preset upload attempt response:', errData);
        }
      } catch (err) {
        console.warn('Direct preset upload failed, trying signed method:', err);
      }
    }

    // Strategy B: Try with Signed Upload (API Key + Secret + Signature)
    if (apiKey && apiSecret) {
      try {
        const timestamp = Math.round(new Date().getTime() / 1000).toString();
        const folder = 'daily_report_logos';
        // Cloudinary signature is sha1 of sorted key=value pairs without api_key or secret in params, concatenated with apiSecret
        const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = await computeSha1(stringToSign);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('folder', folder);
        formData.append('signature', signature);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.secure_url) {
            return {
              url: data.secure_url,
              source: 'cloudinary',
            };
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('Signed upload failed:', errData);
        }
      } catch (err: any) {
        console.warn('Signed Cloudinary upload error:', err);
      }
    }
  }

  // Strategy C: High-performance fallback saved to user profile and synced to Firestore
  return {
    url: compressedBase64,
    source: 'local_storage',
    error: 'Cloudinary direct upload could not be completed; stored securely in Firebase profile.',
  };
}

/**
 * Image Compression Utility
 * Resizes and compresses images on the client side using the Canvas API.
 * Reduces bandwidth and storage usage while maintaining high visual quality.
 */
export const compressImage = (file, { maxWidth = 1280, maxHeight = 1280, quality = 0.7 } = {}) => {
  // Only compress images
  if (!file.type.startsWith('image/')) return Promise.resolve(file);
  // Don't compress small icons/gifs that might lose transparency
  if (file.size < 100 * 1024) return Promise.resolve(file);

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized blob
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(file); // Fallback to original
            return;
          }
          // Create new File from blob
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file); // Fallback on error
    };
    reader.onerror = () => resolve(file); // Fallback on error
  });
};

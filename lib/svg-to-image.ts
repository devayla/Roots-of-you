/**
 * Converts an image URL to a base64 data URI
 */
async function imageUrlToDataUri(url: string): Promise<string> {
  try {
    const response = await fetch(url, { mode: 'cors' });
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
    console.warn(`Failed to convert image URL to data URI: ${url}`, error);
    // Return a transparent 1x1 pixel as fallback
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
}

/**
 * Embeds all external images in an SVG as base64 data URIs
 */
async function embedImagesInSvg(svgElement: SVGSVGElement): Promise<void> {
  const imageElements = svgElement.querySelectorAll('image[href]');
  const promises: Promise<void>[] = [];

  imageElements.forEach((img) => {
    const href = img.getAttribute('href');
    if (href && !href.startsWith('data:')) {
      const promise = imageUrlToDataUri(href).then((dataUri) => {
        img.setAttribute('href', dataUri);
        img.setAttribute('xlink:href', dataUri); // Also set xlink:href for compatibility
      });
      promises.push(promise);
    }
  });

  await Promise.all(promises);
}

/**
 * Attempts to read SVG width/height from viewBox or width/height attributes
 */
function getSvgDimensions(svgElement: SVGSVGElement, widthOverride?: number, heightOverride?: number) {
  if (widthOverride && heightOverride) {
    return { width: widthOverride, height: heightOverride }
  }

  const viewBox = svgElement.getAttribute('viewBox')
  if (viewBox) {
    const parts = viewBox.split(/\s+|,/).map(Number)
    if (parts.length === 4 && !parts.some((v) => Number.isNaN(v))) {
      const [, , vbWidth, vbHeight] = parts
      return { width: vbWidth, height: vbHeight }
    }
  }

  const attrWidth = svgElement.getAttribute('width')
  const attrHeight = svgElement.getAttribute('height')

  const width = widthOverride || (attrWidth ? parseInt(attrWidth, 10) : 1000)
  const height = heightOverride || (attrHeight ? parseInt(attrHeight, 10) : 900)

  return { width, height }
}

/**
 * Converts an SVG element to a PNG blob
 * @param svgElement - The SVG element to convert
 * @param width - Optional width (defaults to SVG's viewBox width)
 * @param height - Optional height (defaults to SVG's viewBox height)
 * @returns Promise<Blob> - PNG image blob
 */
export async function svgToImageBlob(
  svgElement: SVGSVGElement,
  width?: number,
  height?: number
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // Get SVG dimensions from viewBox or attributes
      const { width: svgWidth, height: svgHeight } = getSvgDimensions(svgElement, width, height)
      
      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      
      // Ensure the cloned SVG has proper attributes
      clonedSvg.setAttribute('width', svgWidth.toString());
      clonedSvg.setAttribute('height', svgHeight.toString());
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

      // Inject background gradient + rect so minted image matches frontend background
      let defs = clonedSvg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        clonedSvg.insertBefore(defs, clonedSvg.firstChild);
      }

      // Create gradient if not present
      let bgGradient = defs.querySelector('#bgGradientCapture');
      if (!bgGradient) {
        bgGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        bgGradient.setAttribute('id', 'bgGradientCapture');
        bgGradient.setAttribute('x1', '0%');
        bgGradient.setAttribute('y1', '0%');
        bgGradient.setAttribute('x2', '0%');
        bgGradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#e0f7fa');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '50%');
        stop2.setAttribute('stop-color', '#f1f8e9');

        const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop3.setAttribute('offset', '100%');
        stop3.setAttribute('stop-color', '#fff3e0');

        bgGradient.appendChild(stop1);
        bgGradient.appendChild(stop2);
        bgGradient.appendChild(stop3);
        defs.appendChild(bgGradient);
      }

      // Background rect goes at the very back
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', '0');
      bgRect.setAttribute('y', '0');
      bgRect.setAttribute('width', svgWidth.toString());
      bgRect.setAttribute('height', svgHeight.toString());
      bgRect.setAttribute('fill', 'url(#bgGradientCapture)');
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

      // Embed all external images as base64 data URIs
      await embedImagesInSvg(clonedSvg);
      
      // Serialize SVG to string
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      
      // Create a data URL
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      // Create an image element
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Create a canvas
        const canvas = document.createElement('canvas');
        canvas.width = svgWidth;
        canvas.height = svgHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Fill full canvas with the same vertical gradient background (100% width & height)
        const gradient = ctx.createLinearGradient(0, 0, 0, svgHeight);
        gradient.addColorStop(0, '#e0f7fa');
        gradient.addColorStop(0.5, '#f1f8e9');
        gradient.addColorStop(1, '#fff3e0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, svgWidth, svgHeight);
        
        // Draw the image onto the canvas on top of that background
        ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/png',
          1.0 // Quality: 1.0 = 100% quality
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG image'));
      };
      
      img.src = url;
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unknown error converting SVG to image'));
    }
  });
}

/**
 * Captures an SVG element with its background and converts to PNG blob
 * This function captures the entire container including background gradients
 * @param containerElement - The container div that holds the SVG
 * @param svgElement - The SVG element to capture
 * @returns Promise<Blob> - PNG image blob
 */
export async function captureTreeWithBackground(
  containerElement: HTMLElement,
  svgElement: SVGSVGElement
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Use html2canvas-like approach or direct SVG capture
      // For now, we'll use the SVG directly and add background via SVG gradient
      const { width: svgWidth, height: svgHeight } = getSvgDimensions(svgElement)
      
      // Clone SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('width', svgWidth.toString());
      clonedSvg.setAttribute('height', svgHeight.toString());
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Add background rectangle if not present
      const defs = clonedSvg.querySelector('defs');
      if (defs) {
        // Check if background rect exists
        const bgRect = clonedSvg.querySelector('rect[data-background]');
        if (!bgRect) {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('width', svgWidth.toString());
          rect.setAttribute('height', svgHeight.toString());
          rect.setAttribute('fill', 'url(#backgroundGradient)');
          rect.setAttribute('data-background', 'true');
          
          // Try to add gradient if it doesn't exist
          let bgGradient = defs.querySelector('#backgroundGradient');
          if (!bgGradient) {
            bgGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            bgGradient.setAttribute('id', 'backgroundGradient');
            bgGradient.setAttribute('x1', '0%');
            bgGradient.setAttribute('y1', '0%');
            bgGradient.setAttribute('x2', '0%');
            bgGradient.setAttribute('y2', '100%');
            
            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', '#e0f7fa');
            
            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '50%');
            stop2.setAttribute('stop-color', '#f1f8e9');
            
            const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop3.setAttribute('offset', '100%');
            stop3.setAttribute('stop-color', '#fff3e0');
            
            bgGradient.appendChild(stop1);
            bgGradient.appendChild(stop2);
            bgGradient.appendChild(stop3);
            defs.appendChild(bgGradient);
          }
          
          clonedSvg.insertBefore(rect, clonedSvg.firstChild);
        }
      }
      
      // Convert to blob using the standard function
      svgToImageBlob(clonedSvg, svgWidth, svgHeight)
        .then(resolve)
        .catch(reject);
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unknown error capturing tree'));
    }
  });
}



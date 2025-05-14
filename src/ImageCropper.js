import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; // Import default styling

// Helper function to generate the cropped image (often found in react-image-crop examples)
function getCroppedImg(image, pixelCrop, fileName) {
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  // devicePixelRatio slightly increases sharpness on retina devices
  // but can cause issues when cutting out pieces of shadows, so lower settings are generally better.
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(pixelCrop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(pixelCrop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = pixelCrop.x * scaleX;
  const cropY = pixelCrop.y * scaleY;

  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();

  // 5) Move the crop origin to the canvas origin (0,0)
  ctx.translate(-cropX, -cropY);
  // 4) Move the origin to the center of the original position
  ctx.translate(centerX, centerY);
  // 3) Rotate around the origin
  // ctx.rotate(rotate * Math.PI / 180) // Rotation logic removed for simplicity
  // 2) Scale the image
  // ctx.scale(scale, scale) // Scale logic removed for simplicity
  // 1) Move the center of the image to the origin (0,0)
  ctx.translate(-centerX, -centerY);

  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight
  );

  ctx.restore();

  // Return Promise to get Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        reject(new Error('Canvas is empty'));
        return;
      }
      blob.name = fileName; // Add filename property to the blob
      // Cleanup canvas
      canvas.remove();
       resolve(blob); // Pass the blob directly
    }, 'image/jpeg'); // You can change the format if needed (e.g., 'image/png')
  });
}


function ImageCropper({ src, onCropComplete, onCancel }) {
  const aspect = undefined; // Make it freeform (or set 1 for square, 16 / 9 for wide, etc.)
  const [crop, setCrop] = useState(); // This stores { unit: '%', x, y, width, height }
  const [completedCrop, setCompletedCrop] = useState(); // This stores the pixel crop data
  const imgRef = useRef(null);

   // Center the crop region on image load
   function onImageLoad(e) {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          // You don't need preset values here if you want it freeform
          // Let's center a 50% initial crop as a starting point
          unit: '%',
          width: 50,
        },
        aspect || width / height, // Calculate aspect based on image or use undefined for freeform
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
    setCompletedCrop(convertToPixelCrop(crop, width, height)); // Initialize completed crop
  }

  async function handleCropImage() {
    const image = imgRef.current;
    if (!image || !completedCrop || !completedCrop.width || !completedCrop.height) {
      console.error('Image ref or crop dimensions missing');
      // Optionally, notify the user
      alert("Could not crop image. Please ensure you've selected a crop area.");
      return;
    }

    try {
       const croppedBlob = await getCroppedImg(
           image,
           completedCrop,
           `cropped-${Date.now()}.jpg` // Generate a simple filename
       );
        // Generate a temporary URL for the Blob to show a preview immediately *if needed*,
        // otherwise just pass the blob. Let's pass the blob.
       onCropComplete(croppedBlob); // Send the Blob back to the App component
    } catch (e) {
        console.error("Cropping failed: ", e);
        alert("Image cropping failed. Please try again."); // Notify user
    }

  }


  if (!src) {
    return null; // Don't render anything if there's no source image
  }

  return (
    <div className="cropper-modal-overlay"> {/* Basic overlay styling */}
      <div className="cropper-modal-content">
        <h3>Crop Your Image</h3>
        <p>Select the relevant area to analyze.</p>
        <div className="cropper-container">
          <ReactCrop
            crop={crop}
            onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)} // Update percent crop state
            onComplete={(c) => setCompletedCrop(c)} // Update pixel crop state
            aspect={aspect}
             minWidth={50} // Minimum crop size in pixels
             minHeight={50}
            // circularCrop={true} // Uncomment for circular crop
             locked={false} // Keep unlocked initially unless aspect is set
          >
             {/* We must provide an img element */}
            <img
              ref={imgRef}
              alt="Crop me"
              src={src}
              style={{ maxHeight: '70vh', display: 'block' }} // Style to fit within modal
               onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>
        <div className="cropper-actions">
          <button onClick={handleCropImage} className="button button-crop">
            Crop
          </button>
          <button onClick={onCancel} className="button button-cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropper;
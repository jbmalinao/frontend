import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'; 

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

  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
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

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        reject(new Error('Canvas is empty'));
        return;
      }
      blob.name = fileName; 
      canvas.remove();
       resolve(blob); 
    }, 'image/jpeg'); 
  });
}


function ImageCropper({ src, onCropComplete, onCancel }) {
  const aspect = undefined; 
  const [crop, setCrop] = useState(); 
  const [completedCrop, setCompletedCrop] = useState(); 
  const imgRef = useRef(null);

   function onImageLoad(e) {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 50,
        },
        aspect || width / height, 
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
    setCompletedCrop(convertToPixelCrop(crop, width, height)); 
  }

  async function handleCropImage() {
    const image = imgRef.current;
    if (!image || !completedCrop || !completedCrop.width || !completedCrop.height) {
      console.error('Image ref or crop dimensions missing');
      alert("Could not crop image. Please ensure you've selected a crop area.");
      return;
    }

    try {
       const croppedBlob = await getCroppedImg(
           image,
           completedCrop,
           `cropped-${Date.now()}.jpg` 
       );
       onCropComplete(croppedBlob); 
    } catch (e) {
        console.error("Cropping failed: ", e);
        alert("Image cropping failed. Please try again."); 
    }

  }


  if (!src) {
    return null; 
  }

  return (
    <div className="cropper-modal-overlay"> {}
      <div className="cropper-modal-content">
        <h3>Crop Your Image</h3>
        <p>Select the relevant area to analyze.</p>
        <div className="cropper-container">
          <ReactCrop
            crop={crop}
            onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)} 
            onComplete={(c) => setCompletedCrop(c)} 
            aspect={aspect}
             minWidth={50} 
             minHeight={50}
             locked={false}
          >
             {}
            <img
              ref={imgRef}
              alt="Crop me"
              src={src}
              style={{ maxHeight: '70vh', display: 'block' }} 
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
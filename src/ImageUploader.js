import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

function ImageUploader({ onImageUpload, selectedPreviewUrl }) {
  const [internalPreview, setInternalPreview] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (file) {
      onImageUpload(file);
      setInternalPreview(null);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/jpg': []
    },
    multiple: false
  });

  useEffect(() => {
    if (selectedPreviewUrl && selectedPreviewUrl !== internalPreview) {
        setInternalPreview(selectedPreviewUrl);
    } else if (!selectedPreviewUrl && internalPreview) {
         setInternalPreview(null);
     }
  }, [selectedPreviewUrl, internalPreview]);

  const displayPreviewUrl = selectedPreviewUrl || internalPreview;

  return (
    // Make the dropzone div itself a flex container for centering
    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />
      {
        displayPreviewUrl ? ( 
          <img src={displayPreviewUrl} alt="Preview" className="preview-image" />
        ) : isDragActive ? ( 
          <p className="dropzone-text">Drop the image here ...</p> 
        ) : ( 
          <div className="dropzone-content"> {}
            <img src="/icons/upload-icon.png" alt="Upload Icon" className="dropzone-icon" /> {}
            <p className="dropzone-text">Drop an image here or click to select</p>
          </div>
        )
      }
    </div>
  );
}

export default ImageUploader;
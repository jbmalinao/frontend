import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './ImageUploader';
import StockImages from './StockImages';
import ResultsDisplay from './ResultsDisplay';
import ImageCropper from './ImageCropper';
import './App.css';

function App() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [originalImageSrc, setOriginalImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageBlobToAnalyze, setImageBlobToAnalyze] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    console.log("App component mounted, trying to hide splash screen."); 
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      console.log("Splash screen element found by App.js."); 
      const timer = setTimeout(() => {
        splashScreen.classList.add('hidden');
        console.log("Added 'hidden' class to splash screen."); 
      }, 3000);

      const transitionEndListener = () => {
        if (splashScreen.parentNode) {
          splashScreen.parentNode.removeChild(splashScreen);
          console.log("Splash screen removed from DOM after transition."); 
        }
      };
      splashScreen.addEventListener('transitionend', transitionEndListener, { once: true });

      return () => {
        clearTimeout(timer);
        splashScreen.removeEventListener('transitionend', transitionEndListener);
        console.log("Cleanup function for splash screen effect ran."); 
      };
    } else {
      console.warn("Splash screen element (#splash-screen) NOT found by App.js. Check index.html.");
    }
  }, []);

  // Image Processing Function (Using Backend API)
  const processImageForAnalysis = useCallback(async (imageBlob, identifier) => {
    if (!imageBlob) {
      setError("No image data to analyze.");
      return;
    }

    setIsLoading(true);
    setResults(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', imageBlob, identifier || 'cropped_image.jpg');
    
    const targetUrl = `${BACKEND_URL}/predict`;
    console.log("!!! CRITICAL: Attempting to fetch from this EXACT URL:", targetUrl);
    if (!BACKEND_URL) {
        console.error("!!! CRITICAL: API_BASE_URL is undefined or empty!");
    }
    try {
      const response = await fetch(`${BACKEND_URL}/predict`, {
        method: 'POST',
        body: formData,
    });


      const responseText = await response.text();

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error(`Invalid JSON response from server: ${responseText}`);
      }

      if (!response.ok) {
        const errorMsg = responseData.error || `API Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (responseData.prediction) {
        console.log("API Result (raw object):", responseData);

        const formattedResults = [
          {
            name: responseData.prediction,
            percentage: 100,
          }
        ];
        console.log("Formatted Results for UI:", formattedResults);
        setResults(formattedResults);

      } else if (responseData.error) {
        throw new Error(responseData.error || "Unknown error from server during prediction.");
      } else {
        console.error("Unexpected success response format from API:", responseData);
        throw new Error("Received an unexpected success response format from the analysis server.");
      }

    } catch (err) {
      console.error("Classification fetch/processing error:", err);
      if (err.message.includes('Failed to fetch')) {
        setError("Cannot connect to the analysis server. Please ensure it's running and accessible.");
      } else {
        setError(err.message || "Failed to analyze the image. Please try again.");
      }
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [BACKEND_URL]);

  // --- Handlers ---
  // const handleImageSelected = useCallback((imageSourceUrl) => {
  //   if (previewUrl && previewUrl.startsWith('blob:')) {
  //     URL.revokeObjectURL(previewUrl);
  //   }
  //   if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
  //     URL.revokeObjectURL(originalImageSrc);
  //   }
  //   setPreviewUrl(null);
  //   setResults(null);
  //   setError(null);
  //   setIsLoading(false);
  //   setImageBlobToAnalyze(null);
  //   setOriginalImageSrc(imageSourceUrl);
  //   setShowCropper(true);
  // }, [previewUrl, originalImageSrc]);


const handleImageSelected = useCallback((imageSourceUrl, originalFileObject = null) => { // Added originalFileObject
  console.log("handleImageSelected - imageSourceUrl:", imageSourceUrl);
  console.log("handleImageSelected - originalFileObject (if passed):", originalFileObject);


  if (previewUrl && previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
  }
  if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
    URL.revokeObjectURL(originalImageSrc);
  }

  setPreviewUrl(null); 
  setResults(null);
  setError(null);
  setIsLoading(false);
  
  setOriginalImageSrc(imageSourceUrl); 
  setShowCropper(true);
}, [previewUrl, originalImageSrc]);

  // const handleImageUpload = useCallback((file) => {
  //   const filePreviewUrl = URL.createObjectURL(file);
  //   handleImageSelected(filePreviewUrl);
  // }, [handleImageSelected]);

  const handleImageUpload = useCallback((file) => {
  console.log("handleImageUpload - Received file object:", file);
  if (!file) {
    console.error("handleImageUpload - ERROR: No file received!");
    return;
  }
  if (!(file instanceof File) && !(file instanceof Blob)) {
     console.error("handleImageUpload - ERROR: Received item is not a File or Blob:", file);
     return;
  }
  console.log(`handleImageUpload - File details: name='${file.name}', size=${file.size}, type='${file.type}'`);

  const filePreviewUrl = URL.createObjectURL(file);
  console.log("handleImageUpload - Created blob URL for preview:", filePreviewUrl);

  handleImageSelected(filePreviewUrl, file);
}, [handleImageSelected]);



  const handleStockImageSelect = useCallback((imageUrl) => {
    handleImageSelected(imageUrl);
  }, [handleImageSelected]);

  // const handleCropComplete = useCallback((croppedBlob) => {
  //   if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
  //     URL.revokeObjectURL(originalImageSrc);
  //   }
  //   setOriginalImageSrc(null);
  //   setShowCropper(false);
  //   const croppedUrl = URL.createObjectURL(croppedBlob);
  //   setPreviewUrl(croppedUrl);
  //   setImageBlobToAnalyze(croppedBlob);
  //   processImageForAnalysis(croppedBlob, croppedBlob.name || 'jackfruit_crop.jpg');
  // }, [originalImageSrc, processImageForAnalysis]);
const handleCropComplete = useCallback((croppedBlob) => {
  console.log("handleCropComplete - Received croppedBlob:", croppedBlob);
  if (!croppedBlob) {
    console.error("handleCropComplete - ERROR: croppedBlob is null or undefined!");
    setError("Cropping failed to produce image data."); // Inform user
    setShowCropper(false); 
    if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(originalImageSrc);
    }
    setOriginalImageSrc(null);
    return;
  }
  if (!(croppedBlob instanceof Blob)) {
     console.error("handleCropComplete - ERROR: Cropped item is not a Blob:", croppedBlob);
     setError("Cropped data is not valid image data."); 
     setShowCropper(false);
    if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(originalImageSrc);
    }
    setOriginalImageSrc(null);
     return;
  }
  console.log(`handleCropComplete - Cropped Blob details: size=${croppedBlob.size}, type='${croppedBlob.type}'`);

  if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
    URL.revokeObjectURL(originalImageSrc);
  }
  setOriginalImageSrc(null); 
  setShowCropper(false);

  const croppedUrl = URL.createObjectURL(croppedBlob); 
  setPreviewUrl(croppedUrl);


  processImageForAnalysis(croppedBlob, croppedBlob.name || 'user_cropped_image.jpg');


}, [originalImageSrc, processImageForAnalysis, previewUrl]);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(originalImageSrc);
    }
    setOriginalImageSrc(null);
    setImageBlobToAnalyze(null);
    setError(null);
    setIsLoading(false);
  }, [originalImageSrc]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
        console.log("Revoked final preview Blob URL on cleanup:", previewUrl);
      }
    };
  }, [previewUrl]);


  return (
    <div className="app-container">
      {showCropper && originalImageSrc && (
        <ImageCropper
          src={originalImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
      <div className="left-panel">
        <h2>Upload or Select Jackfruit Image</h2>
        <ImageUploader onImageUpload={handleImageUpload} selectedPreviewUrl={previewUrl} />
        <StockImages onStockImageSelect={handleStockImageSelect} />
      </div>
      <div className="right-panel">
        <ResultsDisplay results={results} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}

export default App;

import React, { useState, useCallback, useEffect } from 'react'; // Make sure useEffect is imported
import ImageUploader from './ImageUploader';
import StockImages from './StockImages';
import ResultsDisplay from './ResultsDisplay';
import ImageCropper from './ImageCropper'; // Import the cropper component
import './App.css';

function App() {
  // --- State ---
  const [previewUrl, setPreviewUrl] = useState(null);
  const [originalImageSrc, setOriginalImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageBlobToAnalyze, setImageBlobToAnalyze] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  // ADD THIS useEffect TO HIDE THE SPLASH SCREEN
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  useEffect(() => {
    console.log("App component mounted, trying to hide splash screen."); // For debugging
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      console.log("Splash screen element found by App.js."); // For debugging
      // You can adjust the timeout or remove it if you want to hide the splash immediately
      // or if you have another loading indicator within your app (like your `isLoading` state)
      // that takes over.
      const timer = setTimeout(() => {
        splashScreen.classList.add('hidden');
        console.log("Added 'hidden' class to splash screen."); // For debugging
      }, 3000); // Give it a bit of time, or tie to your app's readiness

      // Optional: Fully remove the splash screen from the DOM after the transition
      const transitionEndListener = () => {
        if (splashScreen.parentNode) {
          splashScreen.parentNode.removeChild(splashScreen);
          console.log("Splash screen removed from DOM after transition."); // For debugging
        }
      };
      splashScreen.addEventListener('transitionend', transitionEndListener, { once: true });

      return () => {
        clearTimeout(timer);
        splashScreen.removeEventListener('transitionend', transitionEndListener);
        console.log("Cleanup function for splash screen effect ran."); // For debugging
      };
    } else {
      console.warn("Splash screen element (#splash-screen) NOT found by App.js. Check index.html.");
    }
  }, []); // Empty dependency array means this runs only once after the component mounts
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  // END OF SPLASH SCREEN useEffect
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


  // --- Image Processing Function (Using Backend API) ---
  const processImageForAnalysis = useCallback(async (imageBlob, identifier) => {
    if (!imageBlob) {
      setError("No image data to analyze.");
      return;
    }

    setIsLoading(true);
    setResults(null); // Clear previous results
    setError(null);

    const formData = new FormData();
    formData.append('file', imageBlob, identifier || 'cropped_image.jpg');

    try {
        const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            body: formData,
        });

        const responseData = await response.json(); // Always try to parse JSON first

        if (!response.ok) {
            const errorMsg = responseData.error || `API Error: ${response.status} ${response.statusText}`;
            throw new Error(errorMsg);
        }

        // Check if the responseData contains the 'prediction' key
        if (responseData.prediction) {
            console.log("API Result (raw object):", responseData); // e.g., { prediction: "Fruit_fly", class_index: 1 }

            // Transform the single prediction object into an array
            // that ResultsDisplay expects.
            // Since we only have one prediction, we'll give it 100%.
            const formattedResults = [
                {
                    name: responseData.prediction, // Use the 'prediction' value for 'name'
                    percentage: 100 // Assign 100% as we only have one top prediction
                }
            ];
            console.log("Formatted Results for UI:", formattedResults);
            setResults(formattedResults); // Set the state with the formatted array

        } else if (responseData.error) {
            // This should ideally be caught by !response.ok if server returns proper error status codes
            throw new Error(responseData.error || "Unknown error from server during prediction.");
        } else {
            // This case means the server sent a 200 OK but the JSON was not what we expected
            // (e.g., missing 'prediction' and 'error' keys)
            console.error("Unexpected success response format from API:", responseData);
            throw new Error("Received an unexpected success response format from the analysis server.");
        }

    } catch (err) {
        console.error("Classification fetch/processing error:", err);
        if (err.message.includes('Failed to fetch')) {
            setError("Cannot connect to the analysis server. Please ensure it's running and accessible.");
        } else {
            // This is where your "Received invalid response format from analysis server."
            // or other error messages set by `throw new Error(...)` above would land.
            setError(err.message || "Failed to analyze the image. Please try again.");
        }
        setResults(null); // Ensure results are cleared on error
    } finally {
        setIsLoading(false);
    }
  }, []); // Dependencies: If this function uses props or state not defined inside, add them. For now, it's self-contained.

  // --- Handlers ---
  const handleImageSelected = useCallback((imageSourceUrl) => {
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
    setImageBlobToAnalyze(null);
    setOriginalImageSrc(imageSourceUrl);
    setShowCropper(true);
  }, [previewUrl, originalImageSrc]);

  const handleImageUpload = useCallback((file) => {
    const filePreviewUrl = URL.createObjectURL(file);
    handleImageSelected(filePreviewUrl);
  }, [handleImageSelected]);

  const handleStockImageSelect = useCallback((imageUrl) => {
    handleImageSelected(imageUrl);
  }, [handleImageSelected]);

  const handleCropComplete = useCallback((croppedBlob) => {
    if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(originalImageSrc);
    }
    setOriginalImageSrc(null);
    setShowCropper(false);
    const croppedUrl = URL.createObjectURL(croppedBlob);
    setPreviewUrl(croppedUrl);
    setImageBlobToAnalyze(croppedBlob);
    processImageForAnalysis(croppedBlob, croppedBlob.name || 'jackfruit_crop.jpg');
  }, [originalImageSrc, processImageForAnalysis]); // Added processImageForAnalysis

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
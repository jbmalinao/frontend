// import React, { useState, useCallback, useEffect } from 'react'; // Make sure useEffect is imported
// import ImageUploader from './ImageUploader';
// import StockImages from './StockImages';
// import ResultsDisplay from './ResultsDisplay';
// import ImageCropper from './ImageCropper'; // Import the cropper component
// import './App.css';

// function App() {
//   // --- State ---
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [originalImageSrc, setOriginalImageSrc] = useState(null);
//   const [showCropper, setShowCropper] = useState(false);
//   const [imageBlobToAnalyze, setImageBlobToAnalyze] = useState(null);
//   const [results, setResults] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//   // ADD THIS useEffect TO HIDE THE SPLASH SCREEN
//   // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//   useEffect(() => {
//     console.log("App component mounted, trying to hide splash screen."); // For debugging
//     const splashScreen = document.getElementById('splash-screen');
//     if (splashScreen) {
//       console.log("Splash screen element found by App.js."); // For debugging
//       // You can adjust the timeout or remove it if you want to hide the splash immediately
//       // or if you have another loading indicator within your app (like your `isLoading` state)
//       // that takes over.
//       const timer = setTimeout(() => {
//         splashScreen.classList.add('hidden');
//         console.log("Added 'hidden' class to splash screen."); // For debugging
//       }, 3000); // Give it a bit of time, or tie to your app's readiness

//       // Optional: Fully remove the splash screen from the DOM after the transition
//       const transitionEndListener = () => {
//         if (splashScreen.parentNode) {
//           splashScreen.parentNode.removeChild(splashScreen);
//           console.log("Splash screen removed from DOM after transition."); // For debugging
//         }
//       };
//       splashScreen.addEventListener('transitionend', transitionEndListener, { once: true });

//       return () => {
//         clearTimeout(timer);
//         splashScreen.removeEventListener('transitionend', transitionEndListener);
//         console.log("Cleanup function for splash screen effect ran."); // For debugging
//       };
//     } else {
//       console.warn("Splash screen element (#splash-screen) NOT found by App.js. Check index.html.");
//     }
//   }, []); // Empty dependency array means this runs only once after the component mounts
//   // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//   // END OF SPLASH SCREEN useEffect
//   // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


//   // --- Image Processing Function (Using Backend API) ---
//   const processImageForAnalysis = useCallback(async (imageBlob, identifier) => {
//     if (!imageBlob) {
//       setError("No image data to analyze.");
//       return;
//     }

//     setIsLoading(true);
//     setResults(null); // Clear previous results
//     setError(null);

//     const formData = new FormData();
//     formData.append('file', imageBlob, identifier || 'cropped_image.jpg');

//     try {
//         // const response = await fetch('http://localhost:5000/predict', {
//         //     method: 'POST',
//         //     body: formData,
//         // });
        
//         // const apiUrl = process.env.REACT_APP_API_URL;
//         // const response = await fetch(`${apiUrl}/predict`, {
//         // method: 'POST',
//         // body: formData,
//         // });

//         const responseData = await response.json(); // Always try to parse JSON first

//         if (!response.ok) {
//             const errorMsg = responseData.error || `API Error: ${response.status} ${response.statusText}`;
//             throw new Error(errorMsg);
//         }

//         // Check if the responseData contains the 'prediction' key
//         if (responseData.prediction) {
//             console.log("API Result (raw object):", responseData); // e.g., { prediction: "Fruit_fly", class_index: 1 }

//             // Transform the single prediction object into an array
//             // that ResultsDisplay expects.
//             // Since we only have one prediction, we'll give it 100%.
//             const formattedResults = [
//                 {
//                     name: responseData.prediction, // Use the 'prediction' value for 'name'
//                     percentage: 100 // Assign 100% as we only have one top prediction
//                 }
//             ];
//             console.log("Formatted Results for UI:", formattedResults);
//             setResults(formattedResults); // Set the state with the formatted array

//         } else if (responseData.error) {
//             // This should ideally be caught by !response.ok if server returns proper error status codes
//             throw new Error(responseData.error || "Unknown error from server during prediction.");
//         } else {
//             // This case means the server sent a 200 OK but the JSON was not what we expected
//             // (e.g., missing 'prediction' and 'error' keys)
//             console.error("Unexpected success response format from API:", responseData);
//             throw new Error("Received an unexpected success response format from the analysis server.");
//         }

//     } catch (err) {
//         console.error("Classification fetch/processing error:", err);
//         if (err.message.includes('Failed to fetch')) {
//             setError("Cannot connect to the analysis server. Please ensure it's running and accessible.");
//         } else {
//             // This is where your "Received invalid response format from analysis server."
//             // or other error messages set by `throw new Error(...)` above would land.
//             setError(err.message || "Failed to analyze the image. Please try again.");
//         }
//         setResults(null); // Ensure results are cleared on error
//     } finally {
//         setIsLoading(false);
//     }
//   }, []); // Dependencies: If this function uses props or state not defined inside, add them. For now, it's self-contained.

//   // --- Handlers ---
//   const handleImageSelected = useCallback((imageSourceUrl) => {
//     if (previewUrl && previewUrl.startsWith('blob:')) {
//       URL.revokeObjectURL(previewUrl);
//     }
//     if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
//       URL.revokeObjectURL(originalImageSrc);
//     }
//     setPreviewUrl(null);
//     setResults(null);
//     setError(null);
//     setIsLoading(false);
//     setImageBlobToAnalyze(null);
//     setOriginalImageSrc(imageSourceUrl);
//     setShowCropper(true);
//   }, [previewUrl, originalImageSrc]);

//   const handleImageUpload = useCallback((file) => {
//     const filePreviewUrl = URL.createObjectURL(file);
//     handleImageSelected(filePreviewUrl);
//   }, [handleImageSelected]);

//   const handleStockImageSelect = useCallback((imageUrl) => {
//     handleImageSelected(imageUrl);
//   }, [handleImageSelected]);

//   const handleCropComplete = useCallback((croppedBlob) => {
//     if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
//       URL.revokeObjectURL(originalImageSrc);
//     }
//     setOriginalImageSrc(null);
//     setShowCropper(false);
//     const croppedUrl = URL.createObjectURL(croppedBlob);
//     setPreviewUrl(croppedUrl);
//     setImageBlobToAnalyze(croppedBlob);
//     processImageForAnalysis(croppedBlob, croppedBlob.name || 'jackfruit_crop.jpg');
//   }, [originalImageSrc, processImageForAnalysis]); // Added processImageForAnalysis

//   const handleCropCancel = useCallback(() => {
//     setShowCropper(false);
//     if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
//       URL.revokeObjectURL(originalImageSrc);
//     }
//     setOriginalImageSrc(null);
//     setImageBlobToAnalyze(null);
//     setError(null);
//     setIsLoading(false);
//   }, [originalImageSrc]);

//   useEffect(() => {
//     return () => {
//       if (previewUrl && previewUrl.startsWith('blob:')) {
//         URL.revokeObjectURL(previewUrl);
//         console.log("Revoked final preview Blob URL on cleanup:", previewUrl);
//       }
//     };
//   }, [previewUrl]);


//   return (
//     <div className="app-container">
//       {showCropper && originalImageSrc && (
//         <ImageCropper
//           src={originalImageSrc}
//           onCropComplete={handleCropComplete}
//           onCancel={handleCropCancel}
//         />
//       )}
//       <div className="left-panel">
//         <h2>Upload or Select Jackfruit Image</h2>
//         <ImageUploader onImageUpload={handleImageUpload} selectedPreviewUrl={previewUrl} />
//         <StockImages onStockImageSelect={handleStockImageSelect} />
//       </div>
//       <div className="right-panel">
//         <ResultsDisplay results={results} isLoading={isLoading} error={error} />
//       </div>
//     </div>
//   );
// }

// export default App;

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

  // Use environment variable for backend URL
  const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  // ADD THIS useEffect TO HIDE THE SPLASH SCREEN
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  useEffect(() => {
    console.log("App component mounted, trying to hide splash screen."); // For debugging
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      console.log("Splash screen element found by App.js."); // For debugging
      const timer = setTimeout(() => {
        splashScreen.classList.add('hidden');
        console.log("Added 'hidden' class to splash screen."); // For debugging
      }, 3000);

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
  }, []);
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
    setResults(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', imageBlob, identifier || 'cropped_image.jpg');
    
    const targetUrl = `${BACKEND_URL}/predict`;
    console.log("!!! CRITICAL: Attempting to fetch from this EXACT URL:", targetUrl);
    if (!BACKEND_URL) {
        console.error("!!! CRITICAL: API_BASE_URL is undefined or empty!");
        // ... handle error ...
    }
    try {
      const response = await fetch(`${BACKEND_URL}/predict`, {
        method: 'POST',
        body: formData,
      // // });
      // const response = await fetch("https://backend-0p95.onrender.com/predict", {
      // method: "POST",
      // body: formData,
    });


      const responseText = await response.text();

      // Try parsing JSON safely
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
  // In App.js

// Keep a state for the original file if you need to bypass the cropper for testing
// const [rawUploadedFile, setRawUploadedFile] = useState(null); // Optional, for debugging

const handleImageSelected = useCallback((imageSourceUrl, originalFileObject = null) => { // Added originalFileObject
  console.log("handleImageSelected - imageSourceUrl:", imageSourceUrl);
  console.log("handleImageSelected - originalFileObject (if passed):", originalFileObject);

  // Your existing cleanup logic for previewUrl and originalImageSrc
  if (previewUrl && previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
  }
  if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
    URL.revokeObjectURL(originalImageSrc);
  }

  setPreviewUrl(null); // Clear existing preview if any
  setResults(null);
  setError(null);
  setIsLoading(false);
  // setImageBlobToAnalyze(null); // This state doesn't seem to be used if croppedBlob is passed directly

  setOriginalImageSrc(imageSourceUrl); // This is what the cropper will use
  // if (originalFileObject) {
  //   setRawUploadedFile(originalFileObject); // Optional: store it for direct testing
  // }
  setShowCropper(true);
}, [previewUrl, originalImageSrc /*, other dependencies like setPreviewUrl, setResults etc. */]);

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
    setShowCropper(false); // Hide cropper on failure
    // Clean up originalImageSrc if it's a blob URL
    if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(originalImageSrc);
    }
    setOriginalImageSrc(null);
    return;
  }
  if (!(croppedBlob instanceof Blob)) {
     console.error("handleCropComplete - ERROR: Cropped item is not a Blob:", croppedBlob);
     setError("Cropped data is not valid image data."); // Inform user
     // Same cleanup as above
     setShowCropper(false);
    if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(originalImageSrc);
    }
    setOriginalImageSrc(null);
     return;
  }
  console.log(`handleCropComplete - Cropped Blob details: size=${croppedBlob.size}, type='${croppedBlob.type}'`);


  // Clean up the original image source URL (likely a blob URL from upload or stock image URL)
  if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
    URL.revokeObjectURL(originalImageSrc);
  }
  setOriginalImageSrc(null); // Important to clear this
  setShowCropper(false);

  const croppedUrl = URL.createObjectURL(croppedBlob); // For the new preview
  setPreviewUrl(croppedUrl);
  // setImageBlobToAnalyze(croppedBlob); // This state doesn't seem to be used

  // -------- THIS IS THE KEY CALL --------
  // If you have a separate compression function like processAndSendImage:
  // processAndSendImage(croppedBlob);
  // Otherwise, call processImageForAnalysis directly:
  processImageForAnalysis(croppedBlob, croppedBlob.name || 'user_cropped_image.jpg');
  // ------------------------------------

}, [originalImageSrc, processImageForAnalysis, previewUrl /*, other dependencies like setPreviewUrl, setError etc. */]);

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

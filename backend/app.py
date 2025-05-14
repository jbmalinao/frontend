from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_v2_preprocess_input
# from tensorflow.keras.applications.vgg16 import preprocess_input as vgg16_preprocess_input # Or for VGG16 etc.
# from tensorflow.keras.applications.resnet50 import preprocess_input as resnet50_preprocess_input # Or for ResNet50 etc.
# from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess_input # Or for EfficientNet etc.
from sklearn.preprocessing import StandardScaler
import joblib # Using joblib as per your original full file
from PIL import Image
import numpy as np
import io
import os # For path joining, good practice

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- Configuration ---
# Define a base directory for models if they are in a subfolder relative to app.py
# Or use absolute paths if preferred.
# For example, if models are in a 'models' subfolder:
# MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
# CNN_MODEL_PATH = os.path.join(MODEL_DIR, 'jackfruit_cnn_feature_extractor.h5')
# SCALER_PATH = os.path.join(MODEL_DIR, 'jackfruit_feature_scaler.pkl')
# SVM_MODEL_PATH = os.path.join(MODEL_DIR, 'jackfruit_svm_classifier.pkl')

# Assuming models are in the same directory as app.py for simplicity based on your snippet:
CNN_MODEL_PATH = 'jackfruit_cnn_feature_extractor.h5'
SCALER_PATH = 'jackfruit_feature_scaler.pkl'
SVM_MODEL_PATH = 'jackfruit_svm_classifier.pkl' # Make sure this is the correct SVM model file

IMAGE_WIDTH = 224  # Must match your CNN input size during training
IMAGE_HEIGHT = 224 # Must match your CNN input size during training

# IMPORTANT: This order MUST EXACTLY match the class indices from your training
# (e.g., from train_generator.class_indices in Colab)
# Example: {'Fruit_borer': 0, 'Fruit_fly': 1, 'Healthy': 2, 'Rhizopus_rot': 3}
CLASS_NAMES = ['Fruit_borer', 'Fruit_fly', 'Healthy', 'Rhizopus_rot']

# Select the correct preprocessing function for your base CNN model
# This should match what you used in Colab for feature extraction
MODEL_PREPROCESS_INPUT = mobilenet_v2_preprocess_input
# If you used VGG16:
# MODEL_PREPROCESS_INPUT = vgg16_preprocess_input
# If you used ResNet50:
# MODEL_PREPROCESS_INPUT = resnet50_preprocess_input
# etc.


# --- Load Models ---
# These will be loaded once when the Flask app starts.
cnn_feature_extractor = None
scaler = None
svm_classifier = None

try:
    if os.path.exists(CNN_MODEL_PATH):
        cnn_feature_extractor = tf.keras.models.load_model(CNN_MODEL_PATH)
        print(f"* CNN Feature Extractor model loaded successfully from {CNN_MODEL_PATH}")
    else:
        print(f"!!! CNN Model file not found at {CNN_MODEL_PATH}")
except Exception as e:
    print(f"!!! Error loading CNN Feature Extractor model: {e}")
    # cnn_feature_extractor will remain None

try:
    if os.path.exists(SCALER_PATH):
        scaler = joblib.load(SCALER_PATH)
        print(f"* Scaler loaded successfully from {SCALER_PATH}")
    else:
        print(f"!!! Scaler file not found at {SCALER_PATH}")
except Exception as e:
    print(f"!!! Error loading scaler: {e}")
    # scaler will remain None

try:
    if os.path.exists(SVM_MODEL_PATH):
        svm_classifier = joblib.load(SVM_MODEL_PATH)
        print(f"* SVM Classifier model loaded successfully from {SVM_MODEL_PATH}")
    else:
        print(f"!!! SVM Classifier file not found at {SVM_MODEL_PATH}")
except Exception as e:
    print(f"!!! Error loading SVM Classifier model: {e}")
    # svm_classifier will remain None


# --- Preprocessing Function (Corrected as per your snippet) ---
def preprocess_image(image_bytes):
    """
    Loads image from bytes, resizes, converts to array, and preprocesses
    for the specific CNN model.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize((IMAGE_WIDTH, IMAGE_HEIGHT))
        img_array = tf.keras.preprocessing.image.img_to_array(img)
        # Expand dimensions to create a batch of 1 image
        img_array_expanded = np.expand_dims(img_array, axis=0)
        # Apply the model-specific preprocessing
        preprocessed_img_array = MODEL_PREPROCESS_INPUT(img_array_expanded.copy()) # Use .copy() for safety
        return preprocessed_img_array
    except Exception as e:
        app.logger.error(f"Image preprocessing error: {e}", exc_info=True) # Log full traceback
        return None

# --- Prediction Endpoint ---
@app.route('/predict', methods=['POST'])
def predict():
    # Check if models were loaded successfully
    if cnn_feature_extractor is None:
        app.logger.error("CNN Feature Extractor model is not loaded.")
        return jsonify({"error": "Analysis service error: CNN model not available"}), 503 # Service Unavailable
    if scaler is None:
        app.logger.error("Scaler is not loaded.")
        return jsonify({"error": "Analysis service error: Scaler not available"}), 503
    if svm_classifier is None:
        app.logger.error("SVM Classifier model is not loaded.")
        return jsonify({"error": "Analysis service error: Classifier not available"}), 503

    if 'file' not in request.files:
        return jsonify({"error": "No image file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected for upload"}), 400

    if file: # Check if file exists and is valid
        try:
            image_bytes = file.read()
            preprocessed_img = preprocess_image(image_bytes)

            if preprocessed_img is None:
                # Error already logged in preprocess_image
                return jsonify({"error": "Image preprocessing failed. Check server logs."}), 400 # Bad request if image is bad

            # --- CNN Feature Extraction ---
            # The .predict() method of a Keras model is thread-safe by default
            # but underlying TensorFlow operations might need consideration in highly concurrent environments.
            # For typical web app usage, this should be fine.
            app.logger.debug("Extracting features from preprocessed image...")
            features = cnn_feature_extractor.predict(preprocessed_img)
            app.logger.debug(f"Raw features shape: {features.shape}")

            # --- Feature Scaling ---
            # Ensure features are 2D for scaler.transform, predict should return (1, num_features)
            if features.ndim == 1: # Should not happen if predict output is (1, N)
                features_reshaped = features.reshape(1, -1)
            else:
                features_reshaped = features
            
            scaled_features = scaler.transform(features_reshaped)
            app.logger.debug(f"Scaled features shape: {scaled_features.shape}")

            # --- SVM Prediction ---
            prediction_numeric_array = svm_classifier.predict(scaled_features)
            predicted_class_index = int(prediction_numeric_array[0]) # Convert from numpy int to Python int
            app.logger.debug(f"Predicted class index: {predicted_class_index}")

            if 0 <= predicted_class_index < len(CLASS_NAMES):
                label = CLASS_NAMES[predicted_class_index]
                app.logger.info(f"Prediction successful: Index={predicted_class_index}, Label='{label}'")
                return jsonify({"prediction": label, "class_index": predicted_class_index}) # Sending index back can be useful
            else:
                app.logger.error(f"Predicted class index {predicted_class_index} is out of bounds for CLASS_NAMES (len={len(CLASS_NAMES)}).")
                return jsonify({"error": "Prediction resulted in an invalid class. Check model and CLASS_NAMES consistency."}), 500

        except Exception as e:
            app.logger.error(f"An error occurred during prediction: {e}", exc_info=True) # Log full traceback
            return jsonify({"error": "An unexpected error occurred on the server during prediction."}), 500
    else:
        # This case should ideally be caught by earlier checks, but as a fallback
        return jsonify({"error": "Invalid file provided"}), 400

# --- Health Check Endpoint (Optional but good practice) ---
@app.route('/health', methods=['GET'])
def health_check():
    # Check if essential components are loaded
    models_loaded = cnn_feature_extractor is not None and \
                    scaler is not None and \
                    svm_classifier is not None
    if models_loaded:
        return jsonify({"status": "UP", "message": "Analysis service is running and models are loaded."}), 200
    else:
        return jsonify({"status": "DEGRADED", "message": "Analysis service is running but one or more models failed to load."}), 503


# --- Run the App ---
if __name__ == '__main__':
    # Setup basic logging for Flask if not already configured
    if not app.debug: # Don't use Flask's default logger if in production, configure properly
        import logging
        # Example: stream_handler = logging.StreamHandler()
        # stream_handler.setLevel(logging.INFO)
        # app.logger.addHandler(stream_handler)
        app.logger.setLevel(logging.INFO) # Or DEBUG for more verbosity
    else:
        app.logger.setLevel(logging.DEBUG) # When debug=True, Flask's logger is already quite verbose

    app.logger.info("Starting Jackfruit Disease Classification API...")
    app.run(host='0.0.0.0', port=5000, debug=True) # debug=True is fine for development
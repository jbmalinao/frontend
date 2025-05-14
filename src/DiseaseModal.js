// src/DiseaseModal.js
import React from 'react';
import './DiseaseModal.css'; // We'll create this CSS file

function DiseaseModal({ diseaseName, description, onClose }) {
  if (!diseaseName) { // Don't render if no disease is selected
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}> {/* Close on overlay click */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside modal */}
        <h2>{diseaseName}</h2>
        <p>{description || "No description available for this condition."}</p>
        <button onClick={onClose} className="modal-close-btn">Close</button>
      </div>
    </div>
  );
}

export default DiseaseModal;
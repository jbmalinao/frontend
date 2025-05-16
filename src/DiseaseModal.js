// src/DiseaseModal.js
import React from 'react';
import './DiseaseModal.css'; 

function DiseaseModal({ diseaseName, description, onClose }) {
  if (!diseaseName) { 
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}> {}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {}
        <h2>{diseaseName}</h2>
        <p>{description || "No description available for this condition."}</p>
        <button onClick={onClose} className="modal-close-btn">Close</button>
      </div>
    </div>
  );
}

export default DiseaseModal;
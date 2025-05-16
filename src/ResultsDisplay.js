import React, { useState } from 'react'; 
import DiseaseModal from './/DiseaseModal'; 
import { diseaseDescriptions } from './data/diseaseInfo'; 

function ResultsDisplay({ results, isLoading, error }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState(null); 

  const handleResultClick = (diseaseName) => {
    const description = diseaseDescriptions[diseaseName] || "No specific information available for this condition.";
    setSelectedDisease({ name: diseaseName, description: description });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDisease(null); 
  };

  if (isLoading) {
    return (
        <div className="results-display">
             <h2>Analysis Results</h2>
            <div className="loading-indicator">Analyzing Jackfruit Image...</div>
        </div>
    );
  }

  if (error) {
    
    return (
      <div className="results-display">
         <h2>Analysis Results</h2>
        <div className="results-placeholder error">{error}</div>
      </div>
    );
  }

  if (!results || results.length === 0) {
  
    return (
      <div className="results-display">
        <h2>Analysis Results</h2>
        <div className="results-placeholder">Results will appear here after selecting an image.</div>
      </div>
    );
  }

  const maxPercentage = Math.max(...results.map(r => r.percentage));

  return (
    <div className="results-display">
      <h2>Analysis Results</h2>
      <ul className="results-list">
        {results.map((result, index) => (
          <li
            key={index}
            className="result-item clickable" 
            style={{ borderColor: result.percentage === maxPercentage ? 'var(--jackfruit-yellow)' : 'var(--jackfruit-green-light)' }}
            onClick={() => handleResultClick(result.name)} 
            role="button" 
            tabIndex={0}  
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleResultClick(result.name)} 
          >
            <span>{result.name}:</span>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${result.percentage}%` }}
              >
               {result.percentage > 10 && `${result.percentage}%`}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="disclaimer-note">
        <p>
          <strong>Please take note:</strong> The model is not highly accurate due to a limited dataset.
          These results are for informational purposes only and should not be solely relied upon for critical decisions.
        </p>
      </div>

      {}
      {showModal && selectedDisease && (
        <DiseaseModal
          diseaseName={selectedDisease.name}
          description={selectedDisease.description}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

export default ResultsDisplay;
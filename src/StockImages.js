import React from 'react';

// Assuming images are in public/images/
const stockImageData = [
  { id: 'stock1', src: '/images/stock1.jpg', alt: 'Stock Jackfruit 1' },
  { id: 'stock2', src: '/images/stock2.jpg', alt: 'Stock Jackfruit 2' },
    { id: 'stock3', src: '/images/stock6.jpg', alt: 'Stock Jackfruit 3' },
  { id: 'stock4', src: '/images/stock6.jpeg', alt: 'Stock Jackfruit 4' },
  // Add more images as needed
];

function StockImages({ onStockImageSelect }) {
  return (
    <div className="stock-images">
      <h3>Or choose a sample image:</h3>
      <div className="stock-images-grid">
        {stockImageData.map((image) => (
          <div
            key={image.id}
            className="stock-image-item"
            onClick={() => onStockImageSelect(image.src)} // Pass the src URL up
          >
            <img src={image.src} alt={image.alt} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default StockImages;
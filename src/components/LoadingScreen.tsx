import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ onFadeComplete }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true);
      // Wait for the fade animation to complete before calling onFadeComplete
      setTimeout(onFadeComplete, 500);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onFadeComplete]);

  return (
    <div className={`loading-screen ${isFading ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <img src="/favicon.png" alt="Loading..." className="loading-icon" />
        <h1 className="loading-title">Recombyne</h1>
        <p className="loading-subtitle">Redefining Plasmid Design</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 
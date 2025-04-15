import React from 'react';
import './TextShimmer.css';

const TextShimmer = ({ text = "Thinking..." }) => {
  return (
    <div className="text-shimmer">
      <div className="shimmer-text">{text}</div>
    </div>
  );
};

export default TextShimmer; 
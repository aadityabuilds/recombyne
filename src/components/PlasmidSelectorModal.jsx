import React, { useState, useEffect } from 'react';
import { updateEditor } from "@teselagen/ove";
import store from "../store";
import { plasmidBackbones, getPlasmidSequence } from '../services/PlasmidBackboneService';
import './PlasmidSelectorModal.css';

const PlasmidSelectorModal = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('mammalian');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Close on escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPlasmid = async (plasmidId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the plasmid sequence data
      const sequenceData = await getPlasmidSequence(plasmidId);
      
      // Load it into the editor
      updateEditor(store, "DemoEditor", sequenceData);
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error loading plasmid sequence:', error);
      setError(error.message || 'Failed to load plasmid sequence');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="plasmid-selector-modal">
        <div className="modal-header">
          <h2>Select Plasmid Backbone</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-tabs">
          <button 
            className={selectedCategory === 'mammalian' ? 'active' : ''} 
            onClick={() => setSelectedCategory('mammalian')}
          >
            Mammalian Expression
          </button>
          <button 
            className={selectedCategory === 'bacterial' ? 'active' : ''} 
            onClick={() => setSelectedCategory('bacterial')}
          >
            Bacterial Expression
          </button>
          <button 
            className={selectedCategory === 'cloning' ? 'active' : ''} 
            onClick={() => setSelectedCategory('cloning')}
          >
            Bacterial Cloning
          </button>
          <button 
            className={selectedCategory === 'synthetic' ? 'active' : ''} 
            onClick={() => setSelectedCategory('synthetic')}
          >
            Synthetic Biology
          </button>
        </div>
        
        <div className="plasmid-list">
          {plasmidBackbones[selectedCategory].map(plasmid => (
            <div 
              key={plasmid.id} 
              className="plasmid-card"
              onClick={() => handleSelectPlasmid(plasmid.id)}
            >
              <h3>
                {plasmid.name}
                {plasmid.addgene_id && plasmid.addgene_id !== 1000000 && 
                  <span className="addgene-badge">Addgene</span>
                }
              </h3>
              <p className="plasmid-description">{plasmid.description}</p>
              <div className="plasmid-details">
                <span>{plasmid.size} bp</span>
                <span>{plasmid.source}</span>
              </div>
              <div className="plasmid-features">
                {plasmid.features.map((feature, idx) => (
                  <span key={idx} className="feature-tag">{feature}</span>
                ))}
              </div>
              {plasmid.addgene_id && plasmid.addgene_id !== 1000000 && (
                <a 
                  href={`https://www.addgene.org/vector-database/${plasmid.addgene_id}/`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="addgene-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="addgene-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                  </svg>
                  View on Addgene
                </a>
              )}
            </div>
          ))}
        </div>
        
        {isLoading && <div className="loading-overlay">Loading sequence...</div>}
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="modal-footer">
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default PlasmidSelectorModal; 
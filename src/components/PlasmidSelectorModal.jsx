import React, { useState } from 'react';
import { updateEditor } from "@teselagen/ove";
import store from "../store";
import { plasmidBackbones, getPlasmidSequence } from '../services/PlasmidBackboneService';
import './PlasmidSelectorModal.css';

const PlasmidSelectorModal = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('mammalian');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
        </div>
        
        <div className="plasmid-list">
          {plasmidBackbones[selectedCategory].map(plasmid => (
            <div 
              key={plasmid.id} 
              className="plasmid-card"
              onClick={() => handleSelectPlasmid(plasmid.id)}
            >
              <h3>{plasmid.name}</h3>
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
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../styles/SequenceOptimizerModal.css';

/**
 * Modal component for sequence optimization using DNAChisel
 */
function SequenceOptimizerModal({ isOpen, onClose, sequence, onOptimizeComplete }) {
  const dispatch = useDispatch();
  
  // State for optimization options
  const [isLoading, setIsLoading] = useState(false);
  const [optimizationError, setOptimizationError] = useState(null);
  const [isCircular, setIsCircular] = useState(false);
  
  // Constraints state with parameters aligned with DNAChisel API requirements
  const [constraints, setConstraints] = useState([
    // EnforceGCContent - Parameters: mini, maxi, window
    { type: 'EnforceGCContent', enabled: true, mini: 0.3, maxi: 0.7, window: 50 },
    
    // AvoidPattern - Parameters: pattern
    { type: 'AvoidPattern', enabled: false, pattern: 'BsaI_site' },
    
    // AvoidHairpins - Parameters: stem_size (not min_stem_size), hairpin_window
    { type: 'AvoidHairpins', enabled: false, hairpin_window: 200, stem_size: 6 }
  ]);
  
  // Objectives state with parameters aligned with DNAChisel API requirements
  const [objectives, setObjectives] = useState([
    // CodonOptimize - Parameters: species, location
    // Note: location will be set dynamically based on selected region
    { type: 'CodonOptimize', enabled: false, species: 'e_coli', location: [0, 0] },
  ]);
  
  // Selected sequence region
  const [selectedRegion, setSelectedRegion] = useState({ 
    start: 0, 
    end: sequence ? sequence.length : 0 
  });

  useEffect(() => {
    // Reset state when modal is opened
    if (isOpen) {
      setOptimizationError(null);
      setIsLoading(false);
      
      // Reset selected region when sequence changes
      if (sequence) {
        setSelectedRegion({ start: 0, end: sequence.length });
      }
    }
  }, [isOpen, sequence]);

  // Toggle constraint on/off
  const toggleConstraint = (index) => {
    const updatedConstraints = [...constraints];
    updatedConstraints[index].enabled = !updatedConstraints[index].enabled;
    setConstraints(updatedConstraints);
  };

  // Update constraint parameter
  const updateConstraintParam = (index, param, value) => {
    const updatedConstraints = [...constraints];
    updatedConstraints[index][param] = value;
    setConstraints(updatedConstraints);
  };

  // Toggle objective on/off
  const toggleObjective = (index) => {
    const updatedObjectives = [...objectives];
    updatedObjectives[index].enabled = !updatedObjectives[index].enabled;
    setObjectives(updatedObjectives);
  };

  // Update objective parameter
  const updateObjectiveParam = (index, param, value) => {
    const updatedObjectives = [...objectives];
    updatedObjectives[index][param] = value;
    setObjectives(updatedObjectives);
  };

  // Handle optimization
  const handleOptimize = async () => {
    if (!sequence) {
      setOptimizationError('No sequence provided for optimization');
      return;
    }

    setIsLoading(true);
    setOptimizationError(null);

    try {
      // Filter enabled constraints and objectives
      const activeConstraints = constraints
        .filter(c => c.enabled)
        .map(({ enabled, ...rest }) => rest);
      
      const activeObjectives = objectives
        .filter(o => o.enabled)
        .map(({ enabled, ...rest }) => {
          // If CodonOptimize is enabled, use the selected region
          if (rest.type === 'CodonOptimize') {
            return { ...rest, location: [selectedRegion.start, selectedRegion.end] };
          }
          return rest;
        });

      // Prepare request data
      const requestData = {
        sequence: sequence,
        constraints: activeConstraints,
        objectives: activeObjectives,
        isCircular: isCircular
      };

      // Call the API
      console.log('Sending optimization request:', requestData);
      const response = await fetch('/api/dna-optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      
      // Check if response is OK
      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response as JSON, use the status text
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Get the response text first to validate it's not empty
      const responseText = await response.text();
      console.log('Response length:', responseText.length);
      
      if (!responseText.trim()) {
        throw new Error('Server returned an empty response');
      }
      
      // Try to parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', responseText.substring(0, 200) + '...');
        throw new Error(`Failed to parse server response: ${parseError.message}`);
      }
      
      if (result.success) {
        // Format the constraints summary to be more readable
        let constraintsSummary = "";
        if (result.constraints_summary) {
          // Clean up the constraints summary
          constraintsSummary = result.constraints_summary
            .replace(/===> SUCCESS/g, "✅ SUCCESS")
            .replace(/✔PASS ┍/g, "✓ ")
            .replace(/├/g, "")
            .replace(/│/g, "")
            .replace(/┍/g, "")
            .replace(/Passed !/g, "Passed")
            .replace(/Passed\./g, "Passed")
            .split('\n')
            .filter(line => line.trim() !== '')
            .join('\n');
        }
        
        // Format the objectives summary to be more readable
        let objectivesSummary = "";
        if (result.objectives_summary) {
          objectivesSummary = result.objectives_summary
            .replace(/===> SUCCESS/g, "✅ SUCCESS")
            .replace(/✔PASS ┍/g, "✓ ")
            .replace(/├/g, "")
            .replace(/│/g, "")
            .replace(/┍/g, "")
            .replace(/Passed !/g, "Passed")
            .replace(/Passed\./g, "Passed")
            .split('\n')
            .filter(line => line.trim() !== '')
            .join('\n');
        }
        
        // Create a clean, formatted summary
        const summary = `**Successfully Optimized DNA Sequence**

${constraintsSummary}

${objectivesSummary}

Sequence length: ${result.optimized_sequence.length} bp`;
        
        // Pass both the optimized sequence and the summary
        onOptimizeComplete(result.optimized_sequence, summary);
        onClose();
      } else {
        throw new Error(result.error || 'Optimization failed');
      }
    } catch (error) {
      console.error('Optimization error:', error);
      setOptimizationError(error.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sequence-optimizer-modal-overlay">
      <div className="sequence-optimizer-modal">
        <div className="sequence-optimizer-header">
          <h2>Optimize DNA Sequence</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="sequence-optimizer-content">
          <div className="optimization-section">
            <label className="section-label">Sequence Properties</label>
            <div className="checkbox-option">
              <input
                type="checkbox"
                id="circular-checkbox"
                checked={isCircular}
                onChange={() => setIsCircular(!isCircular)}
              />
              <label htmlFor="circular-checkbox">Circular Sequence</label>
            </div>
            
            <div className="region-selector">
              <label>Selected Region:</label>
              <div className="region-inputs">
                <input
                  type="number"
                  value={selectedRegion.start}
                  min={0}
                  max={sequence ? sequence.length - 1 : 0}
                  onChange={(e) => setSelectedRegion({
                    ...selectedRegion,
                    start: Math.min(parseInt(e.target.value) || 0, selectedRegion.end)
                  })}
                />
                <span>to</span>
                <input
                  type="number"
                  value={selectedRegion.end}
                  min={selectedRegion.start}
                  max={sequence ? sequence.length : 0}
                  onChange={(e) => setSelectedRegion({
                    ...selectedRegion,
                    end: Math.max(parseInt(e.target.value) || 0, selectedRegion.start)
                  })}
                />
              </div>
            </div>
          </div>
          
          <div className="optimization-section">
            <label className="section-label">Constraints</label>
            
            {constraints.map((constraint, index) => (
              <div key={`constraint-${index}`} className="optimization-option">
                <div className="checkbox-option">
                  <input
                    type="checkbox"
                    id={`constraint-${index}`}
                    checked={constraint.enabled}
                    onChange={() => toggleConstraint(index)}
                  />
                  <label htmlFor={`constraint-${index}`}>{constraint.type}</label>
                </div>
                
                {constraint.enabled && (
                  <div className="parameter-inputs">
                    {constraint.type === 'EnforceGCContent' && (
                      <>
                        <div className="parameter-group">
                          <label>Min GC:</label>
                          <input
                            type="number"
                            value={constraint.mini}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={(e) => updateConstraintParam(index, 'mini', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="parameter-group">
                          <label>Max GC:</label>
                          <input
                            type="number"
                            value={constraint.maxi}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={(e) => updateConstraintParam(index, 'maxi', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="parameter-group">
                          <label>Window:</label>
                          <input
                            type="number"
                            value={constraint.window}
                            min={10}
                            onChange={(e) => updateConstraintParam(index, 'window', parseInt(e.target.value))}
                          />
                        </div>
                      </>
                    )}
                    
                    {constraint.type === 'AvoidPattern' && (
                      <div className="parameter-group">
                        <label>Pattern:</label>
                        <select
                          value={constraint.pattern}
                          onChange={(e) => updateConstraintParam(index, 'pattern', e.target.value)}
                        >
                          <option value="BsaI_site">BsaI Site</option>
                          <option value="BsmBI_site">BsmBI Site</option>
                          <option value="BbsI_site">BbsI Site</option>
                          <option value="SapI_site">SapI Site</option>
                          <option value="EcoRI_site">EcoRI Site</option>
                          <option value="BamHI_site">BamHI Site</option>
                          <option value="XhoI_site">XhoI Site</option>
                          <option value="NdeI_site">NdeI Site</option>
                        </select>
                      </div>
                    )}
                    
                    {constraint.type === 'AvoidHairpins' && (
                      <>
                        <div className="parameter-group">
                          <label>Window:</label>
                          <input
                            type="number"
                            value={constraint.hairpin_window}
                            min={50}
                            onChange={(e) => updateConstraintParam(index, 'hairpin_window', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="parameter-group">
                          <label>Stem Size:</label>
                          <input
                            type="number"
                            value={constraint.stem_size}
                            min={3}
                            max={10}
                            onChange={(e) => updateConstraintParam(index, 'stem_size', parseInt(e.target.value))}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="optimization-section">
            <label className="section-label">Objectives</label>
            
            {objectives.map((objective, index) => (
              <div key={`objective-${index}`} className="optimization-option">
                <div className="checkbox-option">
                  <input
                    type="checkbox"
                    id={`objective-${index}`}
                    checked={objective.enabled}
                    onChange={() => toggleObjective(index)}
                  />
                  <label htmlFor={`objective-${index}`}>{objective.type}</label>
                </div>
                
                {objective.enabled && (
                  <div className="parameter-inputs">
                    {objective.type === 'CodonOptimize' && (
                      <div className="parameter-group">
                        <label>Species:</label>
                        <select
                          value={objective.species}
                          onChange={(e) => updateObjectiveParam(index, 'species', e.target.value)}
                        >
                          <option value="e_coli">E. coli</option>
                          <option value="h_sapiens">H. sapiens</option>
                          <option value="s_cerevisiae">S. cerevisiae</option>
                          <option value="c_elegans">C. elegans</option>
                          <option value="b_subtilis">B. subtilis</option>
                          <option value="d_melanogaster">D. melanogaster</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {optimizationError && (
            <div className="error-message">
              {optimizationError}
            </div>
          )}
        </div>
        
        <div className="sequence-optimizer-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button 
            className="optimize-button" 
            onClick={handleOptimize}
            disabled={isLoading}
          >
            {isLoading ? 'Optimizing...' : 'Optimize Sequence'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SequenceOptimizerModal;

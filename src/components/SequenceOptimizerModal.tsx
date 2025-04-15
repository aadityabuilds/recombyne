import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import '../styles/SequenceOptimizerModal.css';

// TypeScript interfaces for constraints and objectives
interface GCContentConstraint {
  type: 'EnforceGCContent';
  enabled: boolean;
  mini: number;
  maxi: number;
  window: number;
}
interface AvoidPatternConstraint {
  type: 'AvoidPattern';
  enabled: boolean;
  pattern: string;
}
interface AvoidHairpinsConstraint {
  type: 'AvoidHairpins';
  enabled: boolean;
  hairpin_window: number;
  stem_size: number;
}
type Constraint = GCContentConstraint | AvoidPatternConstraint | AvoidHairpinsConstraint;

interface CodonOptimizeObjective {
  type: 'CodonOptimize';
  enabled: boolean;
  species: string;
  location: [number, number];
}
type Objective = CodonOptimizeObjective;

interface SelectedRegion {
  start: number;
  end: number;
}

interface SequenceOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sequence: string;
  onOptimizeComplete: (optimizedSequence: string, summary: string) => void;
}

const SequenceOptimizerModal: React.FC<SequenceOptimizerModalProps> = ({ isOpen, onClose, sequence, onOptimizeComplete }) => {
  // --- All logic and JSX for SequenceOptimizerModal should be here, in the typed component ---

  const dispatch = useDispatch();
  
  // State for optimization options
  const [isLoading, setIsLoading] = useState(false);
  const [optimizationError, setOptimizationError] = useState(null);
  const [isCircular, setIsCircular] = useState(false);
  const [selectionWarning, setSelectionWarning] = useState(null);
  
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

  // Validate selection when CodonOptimize is enabled
  const validateSelection = () => {
    // Check if CodonOptimize is enabled
    const codonOptimizeEnabled = objectives.some(o => o.type === 'CodonOptimize' && o.enabled);
    
    if (codonOptimizeEnabled) {
      const length = selectedRegion.end - selectedRegion.start;
      if (length % 3 !== 0) {
        setSelectionWarning(
          `Warning: For codon optimization, the selected region length (${length} bp) should be divisible by 3. ` +
          `The optimization will adjust the selection automatically.`
        );
      } else {
        setSelectionWarning(null);
      }
    } else {
      setSelectionWarning(null);
    }
  };

  useEffect(() => {
    // Reset state when modal is opened
    if (isOpen) {
      setOptimizationError(null);
      setIsLoading(false);
      setSelectionWarning(null);
      
      // Reset selected region when sequence changes
      if (sequence) {
        setSelectedRegion({ start: 0, end: sequence.length });
      }
    }
  }, [isOpen, sequence]);

  // Validate selection when region or objectives change
  useEffect(() => {
    validateSelection();
  }, [selectedRegion, objectives]);

  // Toggle constraint on/off
  const toggleConstraint = (index) => {
    const newConstraints = [...constraints];
    newConstraints[index] = {
      ...newConstraints[index],
      enabled: !newConstraints[index].enabled
    };
    setConstraints(newConstraints);
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
          console.error('Error details:', errorData);
        } catch (parseError) {
          // If we can't parse the error response as JSON, use the status text
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse the JSON response directly
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error(`Failed to parse server response: ${parseError.message}`);
      }
      
      if (!result) {
        throw new Error('Server returned an empty or invalid response');
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

  // Render the error message
  const renderError = () => {
    if (!optimizationError) return null;
    
    return (
      <div className="optimization-error">
        <h4>Optimization Error</h4>
        <p>{optimizationError}</p>
        <p className="error-help">
          If this problem persists, try the following:
          <ul>
            <li>Check that the server is running</li>
            <li>Make sure Python and DNAChisel are properly installed</li>
            <li>If using CodonOptimize, ensure the region is divisible by 3</li>
            <li>Try with fewer constraints</li>
          </ul>
        </p>
      </div>
    );
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
              {selectionWarning && (
                <div className="selection-warning">
                  {selectionWarning}
                </div>
              )}
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
          
          {renderError()}
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

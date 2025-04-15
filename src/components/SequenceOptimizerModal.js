import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import '../styles/SequenceOptimizerModal.css';
const SequenceOptimizerModal = ({ isOpen, onClose, sequence, onOptimizeComplete }) => {
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
                setSelectionWarning(`Warning: For codon optimization, the selected region length (${length} bp) should be divisible by 3. ` +
                    `The optimization will adjust the selection automatically.`);
            }
            else {
                setSelectionWarning(null);
            }
        }
        else {
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
                }
                catch (parseError) {
                    // If we can't parse the error response as JSON, use the status text
                    errorMessage = `${errorMessage}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            // Parse the JSON response directly
            let result;
            try {
                result = await response.json();
            }
            catch (parseError) {
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
            }
            else {
                throw new Error(result.error || 'Optimization failed');
            }
        }
        catch (error) {
            console.error('Optimization error:', error);
            setOptimizationError(error.message || 'An unknown error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    // Render the error message
    const renderError = () => {
        if (!optimizationError)
            return null;
        return (_jsxs("div", { className: "optimization-error", children: [_jsx("h4", { children: "Optimization Error" }), _jsx("p", { children: optimizationError }), _jsxs("p", { className: "error-help", children: ["If this problem persists, try the following:", _jsxs("ul", { children: [_jsx("li", { children: "Check that the server is running" }), _jsx("li", { children: "Make sure Python and DNAChisel are properly installed" }), _jsx("li", { children: "If using CodonOptimize, ensure the region is divisible by 3" }), _jsx("li", { children: "Try with fewer constraints" })] })] })] }));
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "sequence-optimizer-modal-overlay", children: _jsxs("div", { className: "sequence-optimizer-modal", children: [_jsxs("div", { className: "sequence-optimizer-header", children: [_jsx("h2", { children: "Optimize DNA Sequence" }), _jsx("button", { className: "close-button", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "sequence-optimizer-content", children: [_jsxs("div", { className: "optimization-section", children: [_jsx("label", { className: "section-label", children: "Sequence Properties" }), _jsxs("div", { className: "checkbox-option", children: [_jsx("input", { type: "checkbox", id: "circular-checkbox", checked: isCircular, onChange: () => setIsCircular(!isCircular) }), _jsx("label", { htmlFor: "circular-checkbox", children: "Circular Sequence" })] }), _jsxs("div", { className: "region-selector", children: [_jsx("label", { children: "Selected Region:" }), _jsxs("div", { className: "region-inputs", children: [_jsx("input", { type: "number", value: selectedRegion.start, min: 0, max: sequence ? sequence.length - 1 : 0, onChange: (e) => setSelectedRegion({
                                                        ...selectedRegion,
                                                        start: Math.min(parseInt(e.target.value) || 0, selectedRegion.end)
                                                    }) }), _jsx("span", { children: "to" }), _jsx("input", { type: "number", value: selectedRegion.end, min: selectedRegion.start, max: sequence ? sequence.length : 0, onChange: (e) => setSelectedRegion({
                                                        ...selectedRegion,
                                                        end: Math.max(parseInt(e.target.value) || 0, selectedRegion.start)
                                                    }) })] }), selectionWarning && (_jsx("div", { className: "selection-warning", children: selectionWarning }))] })] }), _jsxs("div", { className: "optimization-section", children: [_jsx("label", { className: "section-label", children: "Constraints" }), constraints.map((constraint, index) => (_jsxs("div", { className: "optimization-option", children: [_jsxs("div", { className: "checkbox-option", children: [_jsx("input", { type: "checkbox", id: `constraint-${index}`, checked: constraint.enabled, onChange: () => toggleConstraint(index) }), _jsx("label", { htmlFor: `constraint-${index}`, children: constraint.type })] }), constraint.enabled && (_jsxs("div", { className: "parameter-inputs", children: [constraint.type === 'EnforceGCContent' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "parameter-group", children: [_jsx("label", { children: "Min GC:" }), _jsx("input", { type: "number", value: constraint.mini, min: 0, max: 1, step: 0.1, onChange: (e) => updateConstraintParam(index, 'mini', parseFloat(e.target.value)) })] }), _jsxs("div", { className: "parameter-group", children: [_jsx("label", { children: "Max GC:" }), _jsx("input", { type: "number", value: constraint.maxi, min: 0, max: 1, step: 0.1, onChange: (e) => updateConstraintParam(index, 'maxi', parseFloat(e.target.value)) })] }), _jsxs("div", { className: "parameter-group", children: [_jsx("label", { children: "Window:" }), _jsx("input", { type: "number", value: constraint.window, min: 10, onChange: (e) => updateConstraintParam(index, 'window', parseInt(e.target.value)) })] })] })), constraint.type === 'AvoidPattern' && (_jsxs("div", { className: "parameter-group", children: [_jsx("label", { children: "Pattern:" }), _jsxs("select", { value: constraint.pattern, onChange: (e) => updateConstraintParam(index, 'pattern', e.target.value), children: [_jsx("option", { value: "BsaI_site", children: "BsaI Site" }), _jsx("option", { value: "BsmBI_site", children: "BsmBI Site" }), _jsx("option", { value: "BbsI_site", children: "BbsI Site" }), _jsx("option", { value: "SapI_site", children: "SapI Site" }), _jsx("option", { value: "EcoRI_site", children: "EcoRI Site" }), _jsx("option", { value: "BamHI_site", children: "BamHI Site" }), _jsx("option", { value: "XhoI_site", children: "XhoI Site" }), _jsx("option", { value: "NdeI_site", children: "NdeI Site" })] })] })), constraint.type === 'AvoidHairpins' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "parameter-group", children: [_jsx("label", { children: "Window:" }), _jsx("input", { type: "number", value: constraint.hairpin_window, min: 50, onChange: (e) => updateConstraintParam(index, 'hairpin_window', parseInt(e.target.value)) })] }), _jsxs("div", { className: "parameter-group", children: [_jsx("label", { children: "Stem Size:" }), _jsx("input", { type: "number", value: constraint.stem_size, min: 3, max: 10, onChange: (e) => updateConstraintParam(index, 'stem_size', parseInt(e.target.value)) })] })] }))] }))] }, `constraint-${index}`)))] }), _jsxs("div", { className: "optimization-section", children: [_jsx("label", { className: "section-label", children: "Objectives" }), objectives.map((objective, index) => (_jsxs("div", { className: "optimization-option", children: [_jsxs("div", { className: "checkbox-option", children: [_jsx("input", { type: "checkbox", id: `objective-${index}`, checked: objective.enabled, onChange: () => toggleObjective(index) }), _jsx("label", { htmlFor: `objective-${index}`, children: objective.type })] }), objective.enabled && (_jsx("div", { className: "parameter-inputs", children: objective.type === 'CodonOptimize' && (_jsxs("div", { className: "parameter-group", children: [_jsx("label", { children: "Species:" }), _jsxs("select", { value: objective.species, onChange: (e) => updateObjectiveParam(index, 'species', e.target.value), children: [_jsx("option", { value: "e_coli", children: "E. coli" }), _jsx("option", { value: "h_sapiens", children: "H. sapiens" }), _jsx("option", { value: "s_cerevisiae", children: "S. cerevisiae" }), _jsx("option", { value: "c_elegans", children: "C. elegans" }), _jsx("option", { value: "b_subtilis", children: "B. subtilis" }), _jsx("option", { value: "d_melanogaster", children: "D. melanogaster" })] })] })) }))] }, `objective-${index}`)))] }), renderError()] }), _jsxs("div", { className: "sequence-optimizer-footer", children: [_jsx("button", { className: "cancel-button", onClick: onClose, children: "Cancel" }), _jsx("button", { className: "optimize-button", onClick: handleOptimize, disabled: isLoading, children: isLoading ? 'Optimizing...' : 'Optimize Sequence' })] })] }) }));
};
export default SequenceOptimizerModal;

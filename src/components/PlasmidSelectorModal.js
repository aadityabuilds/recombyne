import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
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
    if (!isOpen)
        return null;
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
        }
        catch (error) {
            console.error('Error loading plasmid sequence:', error);
            setError(error.message || 'Failed to load plasmid sequence');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "modal-overlay", children: _jsxs("div", { className: "plasmid-selector-modal", children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { children: "Select Plasmid Backbone" }), _jsx("button", { className: "close-button", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "modal-tabs", children: [_jsx("button", { className: selectedCategory === 'mammalian' ? 'active' : '', onClick: () => setSelectedCategory('mammalian'), children: "Mammalian Expression" }), _jsx("button", { className: selectedCategory === 'bacterial' ? 'active' : '', onClick: () => setSelectedCategory('bacterial'), children: "Bacterial Expression" }), _jsx("button", { className: selectedCategory === 'cloning' ? 'active' : '', onClick: () => setSelectedCategory('cloning'), children: "Bacterial Cloning" }), _jsx("button", { className: selectedCategory === 'synthetic' ? 'active' : '', onClick: () => setSelectedCategory('synthetic'), children: "Synthetic Biology" })] }), _jsx("div", { className: "plasmid-list", children: plasmidBackbones[selectedCategory].map(plasmid => (_jsxs("div", { className: "plasmid-card", onClick: () => handleSelectPlasmid(plasmid.id), children: [_jsxs("h3", { children: [plasmid.name, plasmid.addgene_id && plasmid.addgene_id !== 1000000 &&
                                        _jsx("span", { className: "addgene-badge", children: "Addgene" })] }), _jsx("p", { className: "plasmid-description", children: plasmid.description }), _jsxs("div", { className: "plasmid-details", children: [_jsxs("span", { children: [plasmid.size, " bp"] }), _jsx("span", { children: plasmid.source })] }), _jsx("div", { className: "plasmid-features", children: plasmid.features.map((feature, idx) => (_jsx("span", { className: "feature-tag", children: feature }, idx))) }), plasmid.addgene_id && plasmid.addgene_id !== 1000000 && (_jsxs("a", { href: `https://www.addgene.org/vector-database/${plasmid.addgene_id}/`, target: "_blank", rel: "noopener noreferrer", className: "addgene-link", onClick: (e) => e.stopPropagation(), children: [_jsx("svg", { className: "addgene-icon", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: _jsx("path", { fill: "currentColor", d: "M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" }) }), "View on Addgene"] }))] }, plasmid.id))) }), isLoading && _jsx("div", { className: "loading-overlay", children: "Loading sequence..." }), error && _jsx("div", { className: "error-message", children: error }), _jsx("div", { className: "modal-footer", children: _jsx("button", { onClick: onClose, children: "Cancel" }) })] }) }));
};
export default PlasmidSelectorModal;

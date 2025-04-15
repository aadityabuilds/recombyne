import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Editor, updateEditor } from "@teselagen/ove";
import store from "../store";
import PlasmidSelectorModal from './PlasmidSelectorModal';
import './EditorPane.css';
const EditorPane = () => {
    const [showPlasmidSelector, setShowPlasmidSelector] = useState(false);
    useEffect(() => {
        updateEditor(store, "DemoEditor", {
            sequenceData: {
                circular: true,
                sequence: "",
                features: [],
                primers: [],
                parts: []
            }
        });
    }, []);
    // Configure editor properties
    const editorProps = {
        editorName: "DemoEditor",
        isFullscreen: false, // Important! Changed from true to false for split pane
        showMenuBar: true,
        height: "100%", // Take up all available height in the right pane
        width: "100%", // Take up all available width in the right pane
        annotationVisibility: {
            features: true,
            parts: true,
            primers: true,
            translations: true,
            orfs: true,
            cutsites: true,
            axis: true
        },
        annotationLabelVisibility: {
            features: true,
            parts: true,
            primers: true
        },
        colors: {
            primaryColor: "#0F518A",
            secondaryColor: "#2E8BC0",
            warningColor: "#FF6347",
            reverseSequenceColor: "#FF5722",
            forwardSequenceColor: "#107A40",
            promoter: "#FFB347",
            CDS: "#3FB75C",
            terminator: "#FF3855",
            regulatory: "#A67AC5"
        },
        // For v0.3.48, use simple panels configuration
        // Stack panels vertically by default
        panelsShown: ["circular", "sequence", "properties"]
    };
    return (_jsxs("div", { className: "editor-pane", children: [_jsx(Editor, { ...editorProps }), _jsx(PlasmidSelectorModal, { isOpen: showPlasmidSelector, onClose: () => setShowPlasmidSelector(false) })] }));
};
export default EditorPane;

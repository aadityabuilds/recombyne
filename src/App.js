import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import SplitPane from "./components/SplitPane";
import ChatInterface from "./components/ChatInterface";
import EditorPane from "./components/EditorPane";
import ErrorBoundary from "./components/ErrorBoundary";
import PlasmidSelectorModal from "./components/PlasmidSelectorModal";
import LoadingScreen from "./components/LoadingScreen";
import "./App.css";
function App() {
    const [showPlasmidSelector, setShowPlasmidSelector] = useState(false);
    const [showShortcutTooltip, setShowShortcutTooltip] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const handleLoadingComplete = () => {
        setIsLoading(false);
    };
    // Plasmid selector can be triggered manually instead of on app load
    // Hide the shortcut tooltip after 5 seconds
    useEffect(() => {
        if (showShortcutTooltip) {
            const timer = setTimeout(() => {
                setShowShortcutTooltip(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showShortcutTooltip]);
    return (_jsxs("div", { className: "app-container", children: [isLoading && _jsx(LoadingScreen, { onFadeComplete: handleLoadingComplete }), _jsx("div", { className: "app-title-bar", children: _jsx("h1", { className: "app-title", children: "Recombyne" }) }), _jsxs(ErrorBoundary, { children: [_jsx(SplitPane, { left: _jsx(ChatInterface, {}), right: _jsx(EditorPane, {}) }), _jsx(PlasmidSelectorModal, { isOpen: showPlasmidSelector, onClose: () => setShowPlasmidSelector(false) }), showShortcutTooltip && (_jsxs("div", { className: "keyboard-shortcut-tooltip", children: ["Press ", _jsx("kbd", { children: navigator.platform.includes('Mac') ? '⌘' : 'Ctrl' }), " + ", _jsx("kbd", { children: "R" }), " to toggle chat panel", _jsx("button", { className: "close-tooltip", onClick: () => setShowShortcutTooltip(false), children: "\u00D7" })] }))] }), _jsx("footer", { className: "app-footer" })] }));
}
export default App;

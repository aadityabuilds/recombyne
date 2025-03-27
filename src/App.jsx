import React, { useState, useEffect } from "react";
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

  // Show the plasmid selector when the app first loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPlasmidSelector(true);
    }, 500); // Short delay to ensure app is fully rendered
    
    return () => clearTimeout(timer);
  }, []);

  // Hide the shortcut tooltip after 5 seconds
  useEffect(() => {
    if (showShortcutTooltip) {
      const timer = setTimeout(() => {
        setShowShortcutTooltip(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showShortcutTooltip]);

  return (
    <div className="app-container">
      {isLoading && <LoadingScreen onFadeComplete={handleLoadingComplete} />}
      
      <div className="app-title-bar">
        <h1 className="app-title">Recombyne</h1>
      </div>
      
      <ErrorBoundary>
        <SplitPane 
          left={<ChatInterface />}
          right={<EditorPane />}
        />
        
        <PlasmidSelectorModal 
          isOpen={showPlasmidSelector} 
          onClose={() => setShowPlasmidSelector(false)} 
        />
        
        {showShortcutTooltip && (
          <div className="keyboard-shortcut-tooltip">
            Press <kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</kbd> + <kbd>R</kbd> to toggle chat panel
            <button 
              className="close-tooltip" 
              onClick={() => setShowShortcutTooltip(false)}
            >
              ×
            </button>
          </div>
        )}
      </ErrorBoundary>
      
      <footer className="app-footer"></footer>
    </div>
  );
}

export default App;

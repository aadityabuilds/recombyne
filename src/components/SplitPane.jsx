import React, { useState, useRef, useEffect, useCallback } from 'react';
import './SplitPane.css';

const SplitPane = ({ left, right }) => {
  const [splitPosition, setSplitPosition] = useState(30); // Default 30% for left pane
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const splitContainerRef = useRef(null);
  const dividerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  // Store the last valid split position before collapse
  const lastValidSplitPosition = useRef(30);
  
  // Optimize the mouse move handler with RAF for better performance
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !splitContainerRef.current) return;
    
    // Use requestAnimationFrame to optimize performance
    requestAnimationFrame(() => {
      if (!splitContainerRef.current) return;
      
      const containerRect = splitContainerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mousePosition = e.clientX - containerRect.left;
      
      // Calculate percentage (constrained between 15% and 60%)
      const newSplitPosition = Math.min(
        Math.max((mousePosition / containerWidth) * 100, 15),
        60
      );
      
      // Round to 2 decimal places to avoid excessive re-renders from tiny changes
      const roundedPosition = Math.round(newSplitPosition * 100) / 100;
      lastValidSplitPosition.current = roundedPosition;
      setSplitPosition(roundedPosition);
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleMouseUp);
    
    // Re-enable transitions after dragging stops
    const leftPane = document.querySelector('.split-pane-left');
    const rightPane = document.querySelector('.split-pane-right');
    if (leftPane) leftPane.style.transition = '';
    if (rightPane) rightPane.style.transition = '';
  }, [handleMouseMove]);
  
  // Add touch support
  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      handleMouseMove({
        clientX: touch.clientX,
        preventDefault: () => e.preventDefault()
      });
    }
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    
    // Disable transitions during dragging for better performance
    const leftPane = document.querySelector('.split-pane-left');
    const rightPane = document.querySelector('.split-pane-right');
    if (leftPane) leftPane.style.transition = 'none';
    if (rightPane) rightPane.style.transition = 'none';
    
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleMouseUp);
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  // Set up and clean up event listeners
  useEffect(() => {
    const currentDivider = dividerRef.current;
    
    if (currentDivider) {
      currentDivider.addEventListener('mousedown', handleMouseDown);
      currentDivider.addEventListener('touchstart', handleMouseDown);
    }
    
    return () => {
      if (currentDivider) {
        currentDivider.removeEventListener('mousedown', handleMouseDown);
        currentDivider.removeEventListener('touchstart', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleTouchMove]);

  // More efficient listener for chat collapse state
  useEffect(() => {
    // Function to check if chat is collapsed
    const checkChatCollapsed = () => {
      const chatContainer = document.querySelector('.chat-container');
      if (chatContainer) {
        const isCollapsed = chatContainer.classList.contains('collapsed');
        if (isCollapsed !== isChatCollapsed) {
          setIsChatCollapsed(isCollapsed);
          
          // When expanding, restore the last valid position
          if (!isCollapsed && isChatCollapsed) {
            setSplitPosition(lastValidSplitPosition.current);
          }
          
          // When collapsing, save the current position
          if (isCollapsed && !isChatCollapsed) {
            lastValidSplitPosition.current = splitPosition;
          }
        }
      }
    };

    // Use a better approach than MutationObserver for performance
    // Listen to a custom event emitted when chat is toggled
    const handleChatToggle = () => {
      checkChatCollapsed();
    };
    
    window.addEventListener('chat-toggled', handleChatToggle);
    
    // Initial check
    checkChatCollapsed();
    
    return () => {
      window.removeEventListener('chat-toggled', handleChatToggle);
    };
  }, [isChatCollapsed, splitPosition]);

  return (
    <div 
      className={`split-pane-container ${isDragging ? 'dragging' : ''} ${isChatCollapsed ? 'chat-collapsed' : ''}`} 
      ref={splitContainerRef}
    >
      <div 
        className="split-pane-left"
        style={{ 
          width: isChatCollapsed ? '0%' : `${splitPosition}%`,
          transition: isDragging ? 'none' : undefined
        }}
      >
        {left}
      </div>
      
      <div 
        className="split-pane-divider"
        ref={dividerRef}
        style={{ display: isChatCollapsed ? 'none' : 'block' }}
      />
      
      <div 
        className="split-pane-right"
        style={{ 
          width: isChatCollapsed ? '100%' : `calc(100% - ${splitPosition}% - 1px)`,
          transition: isDragging ? 'none' : undefined
        }}
      >
        {right}
      </div>
    </div>
  );
};

export default SplitPane; 
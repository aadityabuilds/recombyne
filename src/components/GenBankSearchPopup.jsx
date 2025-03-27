import React, { useState, useRef, useEffect } from 'react';
import './GenBankSearchPopup.css';
import { importSequenceFromGenbank } from '../services/GenbankService';
import { updateEditor } from "@teselagen/ove";
import store from "../store";
import TextShimmer from './TextShimmer';
import ExternalLinkIcon from './ExternalLinkIcon';
import ReactMarkdown from 'react-markdown';

// Utility function to debounce rapid operations
const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const GenBankSearchPopup = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Just describe the sequence you are looking for", sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const messagesEndRef = useRef(null);
  const popupRef = useRef(null);

  // Auto-scroll to the bottom of the message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset messages when popup opens
  useEffect(() => {
    if (isOpen) {
      setMessages([
        { id: 1, text: "Just describe the sequence you are looking for", sender: 'ai' }
      ]);
      setInputText('');
    }
  }, [isOpen]);

  // Function to process sequence import requests
  const processSequenceImport = async (query) => {
    try {      
      // Import the sequences from Genbank (returns array of results)
      const sequenceResults = await importSequenceFromGenbank(query);
      
      // Create message with all results
      const successMessage = { 
        id: Date.now() + 3,
        text: 'Found multiple sequences matching your query:',
        sender: 'ai',
        isSequenceResultList: true,
        sequenceResults: sequenceResults, // Array of results
      };
      
      // Add the success message
      setMessages(prev => [...prev, successMessage]);
      
      return true;
    } catch (error) {
      console.error('Error importing sequence:', error);
      
      // Error message
      const errorMessage = { 
        id: Date.now() + 3, 
        text: `Sorry, I couldn't find that sequence. ${error.message || 'Please try a different search.'}`, 
        sender: 'ai',
        isError: true
      };
      
      // Add error message
      setMessages(prev => [...prev, errorMessage]);
      
      return false;
    }
  };

  // Handle import sequence
  const handleImportSequence = (sequenceData) => {
    // Set processing state to show loading indicator
    setIsProcessing(true);
    
    // Use setTimeout to push the heavy operation to the next event loop tick
    setTimeout(() => {
      try {
        console.log(`Importing sequence: ${sequenceData.name}, length: ${sequenceData.sequence.length}`);
        
        // Check if sequence is extremely large
        if (sequenceData.sequence.length > 500000) {
          console.warn("Extremely large sequence detected - this might be slow");
          // Add a warning to the user
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now(), 
              text: `Importing a very large sequence (${(sequenceData.sequence.length/1000).toFixed(1)}kb). This might take a moment...`, 
              sender: 'ai' 
            }
          ]);
        }
        
        // Update the editor with the full sequence data
        updateEditor(store, "DemoEditor", {
          sequenceData: sequenceData
        });
        
        // Show success message
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now(), 
            text: `Successfully imported sequence: ${sequenceData.name || 'Unnamed sequence'}`, 
            sender: 'ai' 
          }
        ]);

        // Close the popup after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (error) {
        console.error("Error importing sequence:", error);
        // Show error message
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now(), 
            text: `Error importing sequence: ${error.message}. The sequence might be too large for the editor.`, 
            sender: 'ai',
            isError: true 
          }
        ]);
      } finally {
        // Always reset processing state
        setIsProcessing(false);
      }
    }, 0);
  };

  // Insert sequence at cursor position
  const insertSequenceAtCursor = (sequenceData) => {
    // Set processing state to show loading indicator
    setIsProcessing(true);
    
    // Use setTimeout to push the heavy operation to the next event loop tick
    setTimeout(() => {
      try {
        console.log("Attempting to insert sequence at cursor position");
        // Get the current editor state
        const editorState = store.getState().VectorEditor.DemoEditor;
        
        if (!editorState) {
          throw new Error("Editor state not found");
        }
        
        // If there's no existing sequence, just import the whole sequence
        if (!editorState.sequenceData || !editorState.sequenceData.sequence) {
          handleImportSequence(sequenceData);
          setIsProcessing(false);
          return;
        }
        
        // Get the current cursor position
        const caretPosition = editorState.caretPosition || 0;
        console.log("Current cursor position:", caretPosition);
        
        const currentSequence = editorState.sequenceData.sequence;
        const sequenceToInsert = sequenceData.sequence;
        
        // Performance optimization for large sequences
        if (currentSequence.length + sequenceToInsert.length > 100000) {
          console.log("Large sequence detected - using optimized approach");
          
          // Use less memory-intensive approach for large sequences
          updateEditor(store, "DemoEditor", {
            sequenceData: {
              ...editorState.sequenceData,
              sequence: currentSequence.substring(0, caretPosition) + 
                        sequenceToInsert + 
                        currentSequence.substring(caretPosition),
              features: editorState.sequenceData.features || [],
              circular: editorState.sequenceData.circular || false
            }
          });
          
          // Show success message
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now(), 
              text: `Inserted ${sequenceToInsert.length} base pairs at position ${caretPosition}`, 
              sender: 'ai' 
            }
          ]);
          
          // Update cursor position in the next tick
          requestAnimationFrame(() => {
            updateEditor(store, "DemoEditor", {
              caretPosition: caretPosition + sequenceToInsert.length
            });
            console.log("Cursor position updated");
            setIsProcessing(false);
            
            // Close the popup after a short delay
            setTimeout(() => {
              onClose();
            }, 1500);
          });
          
          return;
        }
        
        // For smaller sequences, use the original approach
        updateEditor(store, "DemoEditor", {
          sequenceData: {
            ...editorState.sequenceData,
            sequence: currentSequence.substring(0, caretPosition) + 
                      sequenceToInsert + 
                      currentSequence.substring(caretPosition),
            features: editorState.sequenceData.features || [],
            circular: editorState.sequenceData.circular || false
          }
        });
        
        requestAnimationFrame(() => {
          updateEditor(store, "DemoEditor", {
            caretPosition: caretPosition + sequenceToInsert.length
          });
          
          // Show success message
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now(), 
              text: `Inserted ${sequenceToInsert.length} base pairs at position ${caretPosition}`, 
              sender: 'ai' 
            }
          ]);
          
          setIsProcessing(false);
          
          // Close the popup after a short delay
          setTimeout(() => {
            onClose();
          }, 1500);
        });
        
      } catch (error) {
        console.error("Error inserting sequence at cursor:", error);
        
        // Simplified fallback approach - just import the entire sequence
        try {
          console.log("Using simplified fallback approach");
          handleImportSequence(sequenceData);
          setIsProcessing(false);
        } catch (fallbackError) {
          console.error("Fallback approach failed:", fallbackError);
          
          // Show error message
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now(), 
              text: `Unable to insert sequence: ${error.message}. The operation may have been too resource-intensive. Try with a smaller sequence.`, 
              sender: 'ai',
              isError: true 
            }
          ]);
          
          setIsProcessing(false);
        }
      }
    }, 0);
  };

  // Handle submit search
  const handleSubmitSearch = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const query = inputText;
    setInputText('');
    setIsProcessing(true);

    try {
      // Process sequence import
      await processSequenceImport(query);
    } catch (error) {
      console.error('Error processing search:', error);
      // Generic error message
      const errorMessage = { 
        id: Date.now() + 1, 
        text: "I'm sorry, I encountered an error processing your search. Please try again.", 
        sender: 'ai',
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Debounced versions of sequence operations to prevent accidental double clicks
  const debouncedImportSequence = debounce((data) => {
    if (isImporting) return; // Prevent multiple simultaneous imports
    setIsImporting(true);
    handleImportSequence(data);
    setTimeout(() => setIsImporting(false), 1000); // Reset after a second
  }, 500);
  
  const debouncedInsertSequence = debounce((data) => {
    if (isImporting) return; // Prevent multiple simultaneous operations
    setIsImporting(true);
    insertSequenceAtCursor(data);
    setTimeout(() => setIsImporting(false), 1000); // Reset after a second
  }, 500);

  // Render sequence result
  const renderMessage = (message) => {
    if (message.isSequenceResultList) {
      return (
        <div className="sequence-results-list">
          {message.sequenceResults.map((result, index) => (
            <div key={index} className="sequence-result-card">
              <div className="sequence-result-header">
                <a 
                  href={result.genbankUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="see-detail-link"
                >
                  View in Genbank <ExternalLinkIcon />
                </a>
              </div>
              <div className="sequence-result-body">
                <div className="sequence-title">
                  Found sequence: <strong>{result.sequenceData.name}</strong>
                </div>
                <div className="sequence-info">
                  <div className="sequence-details">
                    <div className="sequence-size">
                      {result.sequenceData.sequence.length} bp
                    </div>
                    <div className="sequence-structure">
                      {result.sequenceData.circular ? 'Circular' : 'Linear'}
                    </div>
                  </div>
                  <button 
                    className="import-button insert-button"
                    onClick={() => debouncedInsertSequence(result.sequenceData)}
                    disabled={isProcessing || isImporting}
                  >
                    {isProcessing && isImporting ? 'Inserting...' : 'Insert'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // Check if the message is from AI and potentially contains markdown
    if (message.sender === 'ai' && !message.isSequenceResultList && !message.isError) {
      return (
        <div className="markdown-content">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>
      );
    }
    
    return message.text;
  };

  if (!isOpen) return null;

  return (
    <div className="genbank-popup-overlay">
      <div className="genbank-popup-container" ref={popupRef}>
        <div className="genbank-popup-header">
          <h2>Find Sequences on GenBank</h2>
          <button 
            className="close-button" 
            onClick={onClose} 
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="genbank-messages-container">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'} ${message.isError ? 'error-message' : ''} ${message.isSequenceResultList ? 'sequence-results-container' : ''}`}
            >
              {renderMessage(message)}
            </div>
          ))}
          {isProcessing && (
            <div className="message ai-message processing">
              <TextShimmer text="Searching..." />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="genbank-input-container" onSubmit={handleSubmitSearch}>
          <div className="input-field-wrapper">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Search for genes, plasmids, or accession numbers"
              disabled={isProcessing}
              autoFocus
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={isProcessing || !inputText.trim()}
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenBankSearchPopup; 
import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';
import { importSequenceFromGenbank } from '../services/GenbankService';
import { updateEditor } from "@teselagen/ove";
import store from "../store";
import TextShimmer from './TextShimmer';
import ExternalLinkIcon from './ExternalLinkIcon';
import { analyzePlasmidWithAI } from '../services/OpenAIService';
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

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your AI copilot for plasmid sequence design. How can I help you today?", sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Toggle collapse state
  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Dispatch custom event for SplitPane to detect the change efficiently
    window.dispatchEvent(new CustomEvent('chat-toggled', { 
      detail: { isCollapsed: newCollapsedState } 
    }));
  };

  // Handle keyboard shortcut (Cmd+R on Mac, Ctrl+R on Windows)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault(); // Prevent default browser refresh
        toggleCollapse(); // Use the toggleCollapse function to ensure event dispatch
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isCollapsed]);

  // Function to process sequence import requests
  const processSequenceImport = async (query) => {
    try {      
      // Import the sequences from Genbank (now returns array of results)
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

  // New function to handle importing a sequence to the editor
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
        
        // Simple approach: Just update the editor with the full sequence data
        // This will replace the current sequence, but respect the OVE's internal state management
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

  // New function to insert sequence at cursor position
  const insertSequenceAtCursor = (sequenceData) => {
    // Set processing state to show loading indicator
    setIsProcessing(true);
    
    // Use setTimeout to push the heavy operation to the next event loop tick
    // This prevents UI freezing during the operation
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
        
        // Performance optimization for large sequences:
        // Check if sequence is too large (over 100,000 bp)
        const currentSequence = editorState.sequenceData.sequence;
        const sequenceToInsert = sequenceData.sequence;
        
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
          });
          
          return;
        }
        
        console.log("Current sequence length:", currentSequence.length);
        console.log("Sequence to insert length:", sequenceToInsert.length);
        
        // For smaller sequences, use the original approach
        // First update the sequence data
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
        
        console.log("Sequence updated, now setting cursor position");
        
        // Use requestAnimationFrame instead of setTimeout for better timing
        requestAnimationFrame(() => {
          updateEditor(store, "DemoEditor", {
            caretPosition: caretPosition + sequenceToInsert.length
          });
          console.log("Cursor position updated");
          
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

  // Function to determine if message contains a plasmid analysis query
  const isPlasmidAnalysisQuery = (message) => {
    const analysisKeywords = [
      'describe', 'explain', 'analyze', 'what is', 'tell me about', 'describe',
      'information', 'details', 'components', 'elements', 'features',
      'this plasmid', 'the plasmid', 'this sequence', 'the sequence'
    ];
    
    const lowerMessage = message.toLowerCase();
    return analysisKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
  };

  // Function to determine if message contains a sequence query
  const isSequenceQuery = (message) => {
    const sequenceKeywords = [
      'find', 'search', 'get', 'lookup', 'sequence', 'gene', 'dna', 
      'plasmid', 'vector', 'pcr', 'primer', 'promoter', 'genbank', 
      'ncbi', 'accession'
    ];
    
    const words = message.toLowerCase().split(/\s+/);
    return sequenceKeywords.some(keyword => words.includes(keyword.toLowerCase())) && 
           !isPlasmidAnalysisQuery(message); // Make sure it's not an analysis query
  };

  // Process plasmid analysis query
  const processPlasmidAnalysis = async (query) => {
    try {
      // Get AI analysis of the current plasmid
      const analysis = await analyzePlasmidWithAI(store, query);
      
      // Create response message
      const responseMessage = {
        id: Date.now() + 2,
        text: analysis,
        sender: 'ai'
      };
      
      // Add response to message list
      setMessages(prev => [...prev, responseMessage]);
      
      return true;
    } catch (error) {
      console.error('Error analyzing plasmid:', error);
      
      // Error message
      const errorMessage = {
        id: Date.now() + 2,
        text: `I had trouble analyzing the plasmid: ${error.message || 'An unexpected error occurred.'}`,
        sender: 'ai',
        isError: true
      };
      
      // Add error message
      setMessages(prev => [...prev, errorMessage]);
      
      return false;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const query = inputText;
    setInputText('');
    setIsProcessing(true);

    try {
      // Check if this is a plasmid analysis query
      if (isPlasmidAnalysisQuery(query)) {
        // Process plasmid analysis
        await processPlasmidAnalysis(query);
      }
      // Check if the message is a sequence query
      else if (isSequenceQuery(query)) {
        // Try to process the sequence import
        await processSequenceImport(query);
      } else {
        // Handle other types of messages
        setTimeout(() => {
          const aiResponse = { 
            id: Date.now() + 1, 
            text: "I'm designed to help with DNA sequences. You can ask me to search for a sequence, describe the current plasmid, or analyze its components.", 
            sender: 'ai' 
          };
          setMessages(prev => [...prev, aiResponse]);
        }, 1000);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Generic error message
      const errorMessage = { 
        id: Date.now() + 1, 
        text: "I'm sorry, I encountered an error processing your request. Please try again.", 
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

  // Render a sequence result message
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

  return (
    <div className={`chat-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="chat-header">
        <h2>Recombyne Copilot</h2>
        <button 
          className="collapse-button" 
          onClick={toggleCollapse} 
          aria-label={isCollapsed ? "Expand chat" : "Collapse chat"}
        >
          {isCollapsed ? '+' : '×'}
        </button>
      </div>
      
      <div className="messages-container">
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
            <TextShimmer text="Thinking..." />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="input-container" onSubmit={handleSendMessage}>
        <div className="input-field-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask anything"
            disabled={isProcessing}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={isProcessing || !inputText.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface; 
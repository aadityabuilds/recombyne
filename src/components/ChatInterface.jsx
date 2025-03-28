import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';
import { updateEditor } from "@teselagen/ove";
import store from "../store";
import TextShimmer from './TextShimmer';
import { analyzePlasmidWithAI } from '../services/OpenAIService';
import ReactMarkdown from 'react-markdown';
import GenBankSearchPopup from './GenBankSearchPopup';
import PlasmidSelectorModal from './PlasmidSelectorModal';
import SequenceOptimizerModal from './SequenceOptimizerModal';

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
    { id: 1, text: "Hello! I'm your AI copilot for plasmid sequence design. I can help with:\n\n- Analyzing plasmids\n- Answering molecular biology questions\n- Providing step-by-step guidance for your cloning goals\n- Finding plasmid backbone sequences\n- Optimizing DNA sequences\n\nJust tell me what you're working on, and I'll help you achieve your experimental goals!", sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isGenBankPopupOpen, setIsGenBankPopupOpen] = useState(false);
  const [isPlasmidSelectorOpen, setIsPlasmidSelectorOpen] = useState(false);
  const [isSequenceOptimizerOpen, setIsSequenceOptimizerOpen] = useState(false);
  const [currentSequence, setCurrentSequence] = useState("");
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

  // Function to open GenBank search popup
  const openGenBankSearchPopup = () => {
    setIsGenBankPopupOpen(true);
  };

  // Function to close GenBank search popup
  const closeGenBankSearchPopup = () => {
    setIsGenBankPopupOpen(false);
  };

  // Function to close plasmid selector modal
  const closePlasmidSelector = () => {
    setIsPlasmidSelectorOpen(false);
  };
  
  // Function to handle optimize button click
  const handleOptimizeClick = () => {
    // Get current sequence from the editor
    const state = store.getState();
    const editorState = state.VectorEditor?.DemoEditor;
    
    if (!editorState || !editorState.sequenceData || !editorState.sequenceData.sequence) {
      // Add a message if no sequence is available
      const noSequenceMessage = {
        id: Date.now(),
        text: "Please load a sequence into the editor first before optimizing.",
        sender: 'ai'
      };
      setMessages(prev => [...prev, noSequenceMessage]);
      return;
    }
    
    // Get the sequence data
    const sequence = editorState.sequenceData.sequence;
    setCurrentSequence(sequence);
    
    // Add a message about optimization
    const optimizingMessage = {
      id: Date.now(),
      text: "Opening the sequence optimizer. You can specify constraints like GC content, restriction site avoidance, and codon optimization parameters.",
      sender: 'ai'
    };
    setMessages(prev => [...prev, optimizingMessage]);
    
    // Open the optimizer modal
    setIsSequenceOptimizerOpen(true);
  };
  
  // Handle optimization completion
  const handleOptimizeComplete = (optimizedSequence, summary) => {
    // Update the sequence in the editor
    updateEditor(store, "DemoEditor", {
      sequenceData: {
        ...store.getState().VectorEditor.DemoEditor.sequenceData,
        sequence: optimizedSequence
      }
    });
    
    // Add a success message with the optimization summary
    const successMessage = {
      id: Date.now(),
      text: `Successfully optimized your sequence! ${summary}`,
      sender: 'ai'
    };
    setMessages(prev => [...prev, successMessage]);
  };

  // Check if query is related to plasmid backbones
  const isBackboneQuery = (query) => {
    const backboneKeywords = [
      'backbone', 'vector', 'plasmid template', 'expression vector',
      'cloning vector', 'show me backbones', 'select backbone', 'choose backbone',
      'list of backbones', 'plasmid options', 'available plasmids'
    ];
    
    const lowerQuery = query.toLowerCase();
    return backboneKeywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()));
  };

  // Process general questions and plasmid analysis
  const processGeneralQuestion = async (query) => {
    try {
      // Check if this is a backbone-related query
      if (isBackboneQuery(query)) {
        // Show the plasmid selector modal
        setIsPlasmidSelectorOpen(true);
        
        // Give a response about opening the backbone selector
        const backboneResponse = {
          id: Date.now() + 2,
          text: "I've opened the plasmid backbone selector for you. You can browse and select from common plasmid backbones organized by their primary use case. Click on any plasmid to load it into the editor.",
          sender: 'ai'
        };
        
        setMessages(prev => [...prev, backboneResponse]);
        return true;
      }
      
      // Otherwise, process as a general question
      // Get AI response, passing the entire message history for context
      const response = await analyzePlasmidWithAI(store, query, messages);
      
      // Create response message
      const responseMessage = {
        id: Date.now() + 2,
        text: response,
        sender: 'ai'
      };
      
      // Add response to message list
      setMessages(prev => [...prev, responseMessage]);
      
      return true;
    } catch (error) {
      console.error('Error processing question:', error);
      
      // Error message
      const errorMessage = {
        id: Date.now() + 2,
        text: `I had trouble answering your question: ${error.message || 'An unexpected error occurred.'}`,
        sender: 'ai',
        isError: true
      };
      
      // Add error message
      setMessages(prev => [...prev, errorMessage]);
      
      return false;
    }
  };

  // Handle message sending
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
      // Process all queries through the general question handler
      await processGeneralQuestion(query);
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

  // Render message content
  const renderMessage = (message) => {
    // Check if the message is from AI and potentially contains markdown
    if (message.sender === 'ai' && !message.isError) {
      // Process the content to enhance step-by-step guidance display
      const content = enhanceStepByStepContent(message.text);
      
      return (
        <div className="markdown-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }
    
    return message.text;
  };

  // Function to enhance step-by-step content with better styling
  const enhanceStepByStepContent = (content) => {
    if (!content) return content;
    
    // Check if content contains step-by-step guidance
    const hasSteps = content.match(/Step \d+:/i);
    
    if (!hasSteps) return content;
    
    // Clean up and format the content in a single pass
    let enhancedContent = content
      // First remove any existing markdown formatting
      .replace(/###\s*Step \d+:/g, 'Step $1:')
      // Remove double asterisks
      .replace(/\*\*/g, '')
      // Format all steps in a single pass
      .replace(/Step (\d+):(.*?)(?=Step \d+:|$)/gs, (match, stepNum, stepContent) => {
        return `\n\n### Step ${stepNum}:${stepContent.trim()}\n\n`;
      })
      // Clean up any extra newlines
      .replace(/\n{3,}/g, '\n\n');
    
    return enhancedContent;
  };

  return (
    <>
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
        
        <div className="messages-container" ref={messagesEndRef}>
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'} ${message.isError ? 'error-message' : ''}`}
            >
              {renderMessage(message)}
            </div>
          ))}
          {isProcessing && (
            <div className="message ai-message processing">
              <TextShimmer text="Thinking..." />
            </div>
          )}
        </div>
        
        <div className="chat-bottom-container">
          <div className="search-button-container">
            <button 
              className="sequence-action-button"
              onClick={openGenBankSearchPopup}
            >
              Find Sequences
            </button>
            <button 
              className="sequence-action-button"
              onClick={handleOptimizeClick}
            >
              Optimize
            </button>
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
                disabled={!inputText.trim() || isProcessing}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <GenBankSearchPopup 
        isOpen={isGenBankPopupOpen} 
        onClose={closeGenBankSearchPopup} 
      />
      {isPlasmidSelectorOpen && (
        <PlasmidSelectorModal 
          isOpen={isPlasmidSelectorOpen} 
          onClose={closePlasmidSelector} 
        />
      )}
      <SequenceOptimizerModal
        isOpen={isSequenceOptimizerOpen}
        onClose={() => setIsSequenceOptimizerOpen(false)}
        sequence={currentSequence}
        onOptimizeComplete={(optimizedSequence, summary) => {
          handleOptimizeComplete(optimizedSequence, summary);
          setIsSequenceOptimizerOpen(false);
        }}
      />
    </>
  );
};

export default ChatInterface; 
/**
 * OpenAIService.js
 * Handles interactions with the OpenAI API for natural language processing
 */

// Get OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4'; // Use appropriate model

// System prompt for converting natural language to Entrez search parameters
const SYSTEM_PROMPT = `
You are an expert bioinformatician with deep knowledge of molecular biology, genetic engineering, and the NCBI GenBank database.
Your task is to convert natural language queries about DNA sequences into precise NCBI Entrez API search parameters.

GUIDELINES:
1. Focus ONLY on DNA sequences (ATGC format), not protein sequences.
2. ALWAYS identify and specify both organism and gene when possible - these are critical for accurate search results.
3. Convert vague descriptions into specific GenBank search terms.
4. Use appropriate GenBank search field tags when applicable:
   - [ORGN] for organism names (REQUIRED when organism is identifiable)
   - [GENE] for gene names (REQUIRED when gene is identifiable)
   - [ACCN] for accession numbers
   - [ALL] for general terms
5. For incomplete or ambiguous queries, make reasonable inferences based on standard practices in molecular biology.
6. Return ONLY a JSON object with search parameters, nothing else.

RESPONSE FORMAT:
{
  "searchParams": {
    "term": "The full search term to query GenBank using proper syntax",
    "organism": "The specific organism name using proper nomenclature (e.g., 'Homo sapiens', 'Escherichia coli')",
    "gene": "The specific gene name or identifier if applicable",
    "maxResults": A number between 1-50 indicating how many results to return (default: 5),
    "sort": One of "relevance", "pub_date", or "significance" (default: "relevance")
  },
  "explanation": "A brief explanation of your reasoning for future reference"
}

EXAMPLES:

Input: "Find GFP sequence"
Output: {
  "searchParams": {
    "term": "GFP[GENE] OR Green Fluorescent Protein[GENE]",
    "organism": "Aequorea victoria",
    "gene": "GFP",
    "maxResults": 5,
    "sort": "relevance"
  },
  "explanation": "Searching for the common lab reporter gene GFP (Green Fluorescent Protein), which originated from jellyfish Aequorea victoria"
}

Input: "Get the sequence for E. coli lac operon"
Output: {
  "searchParams": {
    "term": "lacZ[GENE] AND Escherichia coli[ORGN] AND operon[ALL]",
    "organism": "Escherichia coli",
    "gene": "lacZ",
    "maxResults": 5,
    "sort": "relevance"
  },
  "explanation": "Searching for the lac operon regulatory system in E. coli, focusing on the lacZ gene"
}

Input: "Find pcDNA3.1 vector"
Output: {
  "searchParams": {
    "term": "pcDNA3.1[TITL] AND vector[ALL]",
    "organism": "",
    "gene": "",
    "maxResults": 5,
    "sort": "relevance"
  },
  "explanation": "Searching for the common commercial expression vector pcDNA3.1"
}

Input: "human insulin gene"
Output: {
  "searchParams": {
    "term": "insulin[GENE] AND Homo sapiens[ORGN]",
    "organism": "Homo sapiens",
    "gene": "insulin",
    "maxResults": 5,
    "sort": "relevance"
  },
  "explanation": "Searching for the insulin gene in humans"
}

Remember:
1. ALWAYS include organism and gene fields in your response when identifiable
2. Focus ONLY on DNA sequences (ATGC), not protein sequences
3. Use proper NCBI Entrez search syntax
4. Output only valid JSON that can be directly used as API parameters
`;

// Unified system prompt for both plasmid analysis and general questions
const UNIFIED_PROMPT = `
You are an expert molecular biologist and synthetic biology specialist with deep knowledge of plasmids, cloning, and genetic engineering.
You are assisting a user with plasmid design, analysis, and answering questions about molecular biology.

When provided with plasmid data, analyze it and describe it properly. When asked general questions about molecular biology, answer them using your knowledge without requiring plasmid data.

IMPORTANT GUIDELINES:
1. MOST IMPORTANT: If the user asks a general question about molecular biology or plasmids, you MUST answer it regardless of whether there is plasmid data currently loaded in the editor.
2. If plasmid data is provided AND the question is about that specific plasmid, analyze it carefully.
3. If no plasmid data is provided or the plasmid data is empty, but the question is general, answer it using your knowledge.
4. Only describe what is explicitly present in the data when analyzing a specific plasmid.
5. Use proper scientific terminology and provide context when needed.
6. Structure your responses clearly with proper formatting.
7. For general questions, provide accurate, scientifically sound information with practical considerations when applicable.
8. When the user describes their experimental goals or intentions with a plasmid backbone, provide detailed, actionable step-by-step guidance to help them achieve their goal.

RESPONSE FORMAT FOR PLASMID ANALYSIS:
Present information in these sections ONLY if analyzing a specific plasmid and data is available:

1. **Plasmid Overview**
   - Name
   - Size in base pairs
   - Topology (circular/linear)
   - Source/origin (if available)

2. **Key Components**
   - List only explicitly defined genetic elements
   - For each feature include:
     * Name and type
     * Position
     * Orientation

FORMAT FOR GENERAL QUESTIONS:
1. Start with a direct answer to the question
2. Provide relevant technical details and explanations
3. Include practical considerations or tips when applicable
4. Use bullet points or numbered lists for multiple points
5. Use bold text (**text**) for important terms or concepts

FORMAT FOR STEP-BY-STEP GUIDANCE:
When the user describes a goal for plasmid construction or genetic engineering:
1. First briefly explain the overall approach and strategy
2. Provide numbered steps (1., 2., 3.) that are specific, actionable, and in logical order
3. For each step, include:
   - The scientific rationale for the step
   - Specific techniques, enzymes, or reagents to use
   - Expected outcomes and how to verify success
   - Potential pitfalls and troubleshooting tips when relevant
4. Conclude with verification methods to ensure the final construct is correct
5. When providing steps, use the format "Step X: [action]" to make steps clearly identifiable

Always consider the user's specific context, the backbone they're working with, and their stated goals. Provide guidance that balances scientific rigor with practical laboratory considerations.

When possible, connect general knowledge to the current plasmid (if data is available), but always answer the user's question fully.
`;

/**
 * Convert a natural language query to Entrez search parameters
 * @param {string} query - The natural language query from the user
 * @returns {Promise<Object>} The structured search parameters for Entrez API
 */
export const convertNaturalLanguageToEntrezParams = async (query) => {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      console.error('No OpenAI API key provided. Please set REACT_APP_OPENAI_API_KEY in your .env.local file.');
      throw new Error('OpenAI API key is not configured. Please add your API key to the .env.local file.');
    }

    console.log('Sending query to OpenAI:', query);
    console.log('Using API URL:', OPENAI_API_URL);
    console.log('Using API key:', OPENAI_API_KEY ? 'API key is set' : 'API key is missing');
    
    const requestBody = {
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query }
      ],
      temperature: 0.2, // Lower temperature for more deterministic outputs
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${JSON.stringify(errorData)}`;
        console.error('OpenAI API error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response from OpenAI');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Received data from OpenAI:', JSON.stringify(data, null, 2));
    
    const content = data.choices[0]?.message?.content;
    
    console.log('Extracted content:', content);
    
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    // Parse the JSON response
    try {
      const parsedContent = JSON.parse(content);
      console.log('Successfully parsed content as JSON:', parsedContent);
      return parsedContent;
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError);
      console.log('Raw content:', content);
      
      // Attempt to extract JSON from the response if it contains text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedJson = JSON.parse(jsonMatch[0]);
        console.log('Extracted JSON from content:', extractedJson);
        return extractedJson;
      }
      
      throw new Error('Could not parse OpenAI response as JSON');
    }
  } catch (error) {
    console.error('Error converting natural language to Entrez parameters:', error);
    throw error;
  }
};

/**
 * Retrieve current plasmid sequence data from store for AI analysis
 * @param {Object} store - Redux store containing editor state
 * @returns {Object} Plasmid data in a structured format for AI processing
 */
export const getPlasmidDataForAI = (store) => {
  try {
    // More detailed logging of store state
    console.log('Analyzing store state for plasmid data');
    
    if (!store) {
      console.error('Store is undefined');
      return { error: "Store is undefined" };
    }

    const state = store.getState();
    if (!state) {
      console.error('Failed to get state from store');
      return { error: "Failed to get state from store" };
    }

    console.log('Store state structure:', Object.keys(state));
    
    if (!state.VectorEditor) {
      console.error('VectorEditor not found in state');
      return { error: "VectorEditor not found in state" };
    }
    
    console.log('VectorEditor state keys:', Object.keys(state.VectorEditor));
    
    // Get current editor state from store
    const editorState = state.VectorEditor.DemoEditor;
    
    if (!editorState) {
      console.error('DemoEditor not found in VectorEditor state');
      return { error: "No editor state found. Try loading a sequence first." };
    }
    
    console.log('EditorState keys:', Object.keys(editorState));
    
    if (!editorState.sequenceData) {
      console.error('No sequenceData in editor state');
      return { error: "No sequence data available in the editor. Try loading a sequence first." };
    }
    
    const { sequenceData } = editorState;
    console.log('SequenceData keys:', Object.keys(sequenceData));
    
    // Check sequence and features for debugging
    console.log('Sequence length:', sequenceData.sequence ? sequenceData.sequence.length : 'No sequence');
    console.log('Features count:', sequenceData.features ? sequenceData.features.length : 'No features');
    console.log('Parts count:', sequenceData.parts ? sequenceData.parts.length : 'No parts');
    
    // Create a structured representation of the plasmid for AI consumption
    return {
      name: sequenceData.name || "Unnamed Plasmid",
      size: sequenceData.sequence ? sequenceData.sequence.length : 0,
      circular: sequenceData.circular === true ? "Circular" : "Linear",
      features: Array.isArray(sequenceData.features) ? sequenceData.features.map(feature => ({
        name: feature.name || "Unnamed feature",
        type: feature.type || "unknown",
        start: (typeof feature.start === 'number' ? feature.start : 0) + 1, // Convert to 1-indexed for readability
        end: (typeof feature.end === 'number' ? feature.end : 0) + 1,     // Convert to 1-indexed for readability
        direction: feature.forward ? "Forward" : "Reverse",
        notes: feature.notes || {}
      })) : [],
      parts: Array.isArray(sequenceData.parts) ? sequenceData.parts.map(part => ({
        name: part.name || "Unnamed part",
        type: part.type || "unknown",
        start: (typeof part.start === 'number' ? part.start : 0) + 1,
        end: (typeof part.end === 'number' ? part.end : 0) + 1,
        direction: part.forward ? "Forward" : "Reverse"
      })) : [],
      primers: Array.isArray(sequenceData.primers) ? sequenceData.primers.map(primer => ({
        name: primer.name || "Unnamed primer",
        start: (typeof primer.start === 'number' ? primer.start : 0) + 1,
        end: (typeof primer.end === 'number' ? primer.end : 0) + 1,
        direction: primer.forward ? "Forward" : "Reverse"
      })) : [],
      description: sequenceData.description || "",
      source: sequenceData.source || ""
    };
  } catch (error) {
    console.error("Error getting plasmid data for AI:", error);
    return { error: `Failed to analyze plasmid data: ${error.message}` };
  }
};

/**
 * Get AI-generated analysis of the current plasmid in the editor or answer general questions
 * @param {Object} store - Redux store containing editor state
 * @param {string} userQuery - User's query about the plasmid or general question
 * @returns {Promise<string>} AI analysis or answer
 */
export const analyzePlasmidWithAI = async (store, userQuery) => {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key is not configured. Please add your API key to the .env.local file.');
    }

    // Get plasmid data if available
    const plasmidData = getPlasmidDataForAI(store);
    
    // Prepare a proper message for the AI with or without plasmid data
    let userContent = userQuery;
    
    // If plasmid data is available and doesn't contain an error, include it
    if (plasmidData && !plasmidData.error && plasmidData.size > 0) {
      // If there are no features in the sequence, add this info to the prompt
      let additionalInfo = "";
      if (!plasmidData.features || plasmidData.features.length === 0) {
        additionalInfo = "Note: This sequence doesn't have any annotated features.";
      }
      
      userContent = `Here is the plasmid currently in the editor:
${JSON.stringify(plasmidData, null, 2)}

${additionalInfo}

${userQuery}`;
    }
    
    // Create the request with the unified prompt
    const requestBody = {
      model: MODEL,
      messages: [
        { role: 'system', content: UNIFIED_PROMPT },
        { role: 'user', content: userContent }
      ],
      temperature: 0.5, // Balanced temperature for both analysis and general questions
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };
    
    console.log('Making OpenAI request');
    
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('OpenAI error response:', errorData);
        errorMessage += ` - ${JSON.stringify(errorData)}`;
      } catch (e) {
        console.error('Could not parse error response from OpenAI');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Received response from OpenAI');
    
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    return content;
  } catch (error) {
    console.error('Error processing with AI:', error);
    return `I'm having trouble processing your request due to an error: ${error.message}. Please try again or rephrase your question.`;
  }
};

export default {
  convertNaturalLanguageToEntrezParams,
  getPlasmidDataForAI,
  analyzePlasmidWithAI
}; 
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

// System prompt for plasmid analysis and description
const PLASMID_ANALYSIS_PROMPT = `
You are an expert molecular biologist and synthetic biology specialist. You're assisting a user with plasmid design and analysis.

You have access to complete information about a plasmid sequence, including the full nucleotide sequence, any annotated features, and plasmid properties.

IMPORTANT GUIDELINES:
1. Only describe what is explicitly present in the provided data
2. Do not mention missing information or make speculations
3. Present information in a clear, factual manner
4. If a piece of information is not available, simply omit that entire section
5. Never explain what information is missing or why you can't provide certain details

FORMAT YOUR RESPONSE using these sections (ONLY include sections that have actual data):

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

3. **User-Inserted Sequences**
   - Custom inserts and their details
   - Position relative to other elements

Use proper bold formatting (**text**) for section headers and feature names.
Use bullet points for listing features and components.
Keep descriptions concise and factual.
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
 * Get AI-generated analysis of the current plasmid in the editor
 * @param {Object} store - Redux store containing editor state
 * @param {string} userQuery - User's query about the plasmid
 * @returns {Promise<string>} AI analysis of the plasmid
 */
export const analyzePlasmidWithAI = async (store, userQuery) => {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key is not configured. Please add your API key to the .env.local file.');
    }

    // Get plasmid data in structured format
    const plasmidData = getPlasmidDataForAI(store);
    
    if (plasmidData.error) {
      console.error('Error with plasmid data:', plasmidData.error);
      return plasmidData.error;
    }
    
    // If no sequence or no features, return a more helpful message
    if (!plasmidData.size || plasmidData.size === 0) {
      return "There is no sequence loaded in the editor. Please first load a plasmid or sequence using the search function or by selecting a plasmid backbone.";
    }
    
    // If there are no features in the sequence, add this info to the prompt
    let additionalInfo = "";
    if (!plasmidData.features || plasmidData.features.length === 0) {
      additionalInfo = "Note: This sequence doesn't have any annotated features.";
    }
    
    console.log('Analyzing plasmid with AI:', plasmidData);
    
    const requestBody = {
      model: MODEL,
      messages: [
        { role: 'system', content: PLASMID_ANALYSIS_PROMPT },
        { 
          role: 'user', 
          content: `Here is the plasmid currently in the editor:
${JSON.stringify(plasmidData, null, 2)}

${additionalInfo}

${userQuery}` 
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };
    
    console.log('Making OpenAI request for plasmid analysis');
    
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
    console.error('Error analyzing plasmid with AI:', error);
    return `I'm having trouble analyzing the plasmid due to an error: ${error.message}. Please make sure there is a sequence loaded in the editor.`;
  }
};

export default {
  convertNaturalLanguageToEntrezParams,
  getPlasmidDataForAI,
  analyzePlasmidWithAI
}; 
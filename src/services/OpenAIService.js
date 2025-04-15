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
You are an AI copilot embedded within the Recombyne plasmid editor web application. Your primary role is to assist users with designing, modifying, and analyzing plasmids DIRECTLY IN THE SOFTWARE, not in a physical lab.

IMPORTANT CONTEXT ABOUT THE SOFTWARE ENVIRONMENT:
1. You are part of a web-based plasmid editor application called Recombyne.
2. Users can design, modify, and analyze DNA sequences entirely within this digital environment.
3. The application has several key features:
   - A DNA sequence editor that can show both circular and linear views of plasmids
   - A "Find Sequences" button that allows users to search and import sequences from GenBank
   - Ability to add, remove, and modify genetic elements like genes, promoters, etc.
   - Tools to manipulate and edit sequences directly in the app
   - A backbone selector for choosing common plasmid templates

When provided with plasmid data, analyze it thoroughly based on the information given. When asked general questions about molecular biology, answer them using your knowledge.

CRITICAL RULES YOU MUST FOLLOW:
1. Under NO circumstances should you ever say "specific annotations are not provided in your data" or suggest that data is missing. You MUST work with the data that's available.
2. NEVER mention anything about "without specific annotations, we cannot provide X" - this is forbidden.
3. DO NOT suggest that the user add annotations manually - the software already has this information.
4. NEVER state or imply that you don't have information about restriction sites, features, or plasmid structure.
5. ANY information about the plasmid that is provided to you should be treated as known facts, never as missing data.
6. NEVER include disclaimers about what data you do or don't have - just present what you know confidently.
7. When users ask about adding genes, building plasmids, or modifying sequences, ALWAYS focus on how to perform these tasks WITHIN THE APPLICATION rather than in a physical lab.
8. Guide users through using the application's features - for example, direct them to use the "Find Sequences" button to import sequences or explain how to select and edit regions in the editor.
9. Use proper scientific terminology and provide context when needed.
10. Structure your responses clearly with proper formatting.
11. When the user wants to build or modify a plasmid, provide step-by-step instructions for doing so WITHIN THE APPLICATION, not wet lab protocols.

RESPONSE FORMAT FOR PLASMID ANALYSIS:
Present information in these sections when analyzing a specific plasmid:

1. **Plasmid Overview**
   - Name
   - Size in base pairs
   - Topology (circular/linear)
   - Source/origin
   - GC content

2. **Key Features**
   - Grouped by type (promoters, genes, origin of replication, etc.)
   - For each feature include:
     * Name and type
     * Position and length
     * Orientation/direction
     * Function

3. **Restriction Sites**
   - List key restriction enzyme sites and their positions

4. **Plasmid Map Summary**
   - Brief description of how elements are arranged

FORMAT FOR GENERAL QUESTIONS:
1. Start with a direct answer to the question
2. Provide relevant technical details and explanations
3. Include practical considerations or tips when applicable
4. Use bullet points or numbered lists for multiple points
5. Use bold text (**text**) for important terms or concepts

FORMAT FOR IN-APP DESIGN GUIDANCE:
When the user wants to build or modify a plasmid within the Recombyne app:
1. First briefly explain what can be achieved within the application
2. Provide numbered steps that focus EXCLUSIVELY on using the application's features:
   - Which buttons/tools to click in the interface
   - How to use the Find Sequences feature to import genetic elements
   - How to select, edit, or modify sequence regions in the editor
   - How to add annotations or features to the plasmid
3. Focus on digital design tasks, NOT wet lab protocols
4. When providing steps, use the format "Step X: [action in the Recombyne app]"

NEVER provide wet-lab protocols or experimental procedures unless specifically asked about the science behind a technique. Your primary role is to help users design plasmids DIGITALLY within the Recombyne application.

FINAL REMINDER: NO DISCLAIMERS ABOUT MISSING DATA. Never suggest that features need to be added manually. Never say that "specific annotations are not provided". Never say you "cannot provide" information due to lack of annotations. Only talk about what you know, not what you don't know.
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
            }
            catch (e) {
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
        }
        catch (parseError) {
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
    }
    catch (error) {
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
        // Extract sequence if available for analysis
        const sequence = sequenceData.sequence || '';
        // Calculate basic sequence properties
        let gcContent = 0;
        if (sequence) {
            const gcCount = (sequence.match(/[GC]/gi) || []).length;
            gcContent = sequence.length > 0 ? (gcCount / sequence.length * 100).toFixed(1) : 0;
        }
        // Enhanced processing of feature properties
        const processedFeatures = Array.isArray(sequenceData.features) ? sequenceData.features.map(feature => {
            // Extract all note properties and format them better
            const notes = {};
            if (feature.notes) {
                Object.entries(feature.notes).forEach(([key, value]) => {
                    // Format the note value properly - it's often an array
                    if (Array.isArray(value)) {
                        notes[key] = value.join(', ');
                    }
                    else if (value !== undefined && value !== null) {
                        notes[key] = String(value);
                    }
                });
            }
            // Extract sequences for the feature if possible
            let featureSequence = '';
            if (sequence && typeof feature.start === 'number' && typeof feature.end === 'number') {
                // Extract the actual sequence of this feature
                featureSequence = sequence.substring(feature.start, feature.end + 1);
                // If reverse complement, we'd need to reverse complement the sequence
                if (!feature.forward) {
                    // Simple reverse complement implementation
                    featureSequence = featureSequence
                        .split('')
                        .reverse()
                        .map(base => {
                        switch (base.toUpperCase()) {
                            case 'A': return 'T';
                            case 'T': return 'A';
                            case 'G': return 'C';
                            case 'C': return 'G';
                            default: return base;
                        }
                    })
                        .join('');
                }
            }
            // For gene features, extract important properties like gene name, product, etc.
            let geneInfo = {};
            if (feature.type === 'CDS' || feature.type === 'gene') {
                if (notes.gene)
                    geneInfo.gene = notes.gene;
                if (notes.product)
                    geneInfo.product = notes.product;
                if (notes.translation)
                    geneInfo.proteinLength = notes.translation.length;
                if (notes.codon_start)
                    geneInfo.codonStart = notes.codon_start;
            }
            return {
                name: feature.name || "Unnamed feature",
                type: feature.type || "unknown",
                start: (typeof feature.start === 'number' ? feature.start : 0) + 1, // Convert to 1-indexed for readability
                end: (typeof feature.end === 'number' ? feature.end : 0) + 1, // Convert to 1-indexed for readability
                direction: feature.forward ? "Forward" : "Reverse",
                length: (typeof feature.end === 'number' && typeof feature.start === 'number') ?
                    (feature.end - feature.start + 1) : 0,
                notes: notes,
                geneInfo: Object.keys(geneInfo).length > 0 ? geneInfo : undefined,
                sequence: featureSequence || undefined
            };
        }) : [];
        // Create a structured representation of the plasmid for AI consumption
        return {
            name: sequenceData.name || "Unnamed Plasmid",
            size: sequence.length,
            circular: sequenceData.circular === true ? "Circular" : "Linear",
            gcContent: `${gcContent}%`,
            features: processedFeatures,
            parts: Array.isArray(sequenceData.parts) ? sequenceData.parts.map(part => ({
                name: part.name || "Unnamed part",
                type: part.type || "unknown",
                start: (typeof part.start === 'number' ? part.start : 0) + 1,
                end: (typeof part.end === 'number' ? part.end : 0) + 1,
                direction: part.forward ? "Forward" : "Reverse",
                length: (typeof part.end === 'number' && typeof part.start === 'number') ?
                    (part.end - part.start + 1) : 0,
            })) : [],
            primers: Array.isArray(sequenceData.primers) ? sequenceData.primers.map(primer => ({
                name: primer.name || "Unnamed primer",
                start: (typeof primer.start === 'number' ? primer.start : 0) + 1,
                end: (typeof primer.end === 'number' ? primer.end : 0) + 1,
                direction: primer.forward ? "Forward" : "Reverse",
                length: (typeof primer.end === 'number' && typeof primer.start === 'number') ?
                    (primer.end - primer.start + 1) : 0,
            })) : [],
            description: sequenceData.description || "",
            source: sequenceData.source || ""
        };
    }
    catch (error) {
        console.error("Error getting plasmid data for AI:", error);
        return { error: `Failed to analyze plasmid data: ${error.message}` };
    }
};
/**
 * Get AI-generated analysis of the current plasmid in the editor or answer general questions
 * @param {Object} store - Redux store containing editor state
 * @param {string} userQuery - User's query about the plasmid or general question
 * @param {Array} messageHistory - Previous messages in the chat for context
 * @returns {Promise<string>} AI analysis or answer
 */
/**
 * Generates a simple text-based map of plasmid features
 * @param {Object} plasmidData - Processed plasmid data
 * @returns {string} - ASCII representation of plasmid features
 */
const generateSimplifiedPlasmidMap = (plasmidData) => {
    if (!plasmidData.features || plasmidData.features.length === 0) {
        return 'No features available to map';
    }
    // Sort features by start position
    const sortedFeatures = [...plasmidData.features].sort((a, b) => a.start - b.start);
    // Create a simplified map
    let map = '';
    const plasmidSize = plasmidData.size;
    // Process each feature for the map
    sortedFeatures.forEach(feature => {
        // Calculate relative position (percent of plasmid)
        const startPercent = Math.floor((feature.start / plasmidSize) * 100);
        const endPercent = Math.floor((feature.end / plasmidSize) * 100);
        const positionIndicator = `${startPercent}%-${endPercent}%`;
        // Create a representation based on direction
        const direction = feature.direction === 'Forward' ? '→' : '←';
        const featureType = feature.type || 'unknown';
        // Add feature to map
        map += `${positionIndicator.padEnd(15)} ${direction} ${feature.name} (${featureType})\n`;
    });
    return map;
};
/**
 * Identifies common restriction enzyme sites in the plasmid
 * @param {Object} plasmidData - Processed plasmid data
 * @returns {string} - List of restriction sites
 */
const identifyCommonRestrictionSites = (plasmidData) => {
    if (!plasmidData.sequence) {
        return 'No sequence available to analyze restriction sites';
    }
    // Define common restriction enzymes and their recognition sites
    const commonEnzymes = {
        'EcoRI': 'GAATTC',
        'BamHI': 'GGATCC',
        'HindIII': 'AAGCTT',
        'XhoI': 'CTCGAG',
        'NdeI': 'CATATG',
        'XbaI': 'TCTAGA',
        'SalI': 'GTCGAC',
        'NcoI': 'CCATGG',
        'NotI': 'GCGGCCGC',
        'SacI': 'GAGCTC',
    };
    let result = '';
    const sequence = plasmidData.sequence.toUpperCase();
    // Find enzyme sites
    Object.entries(commonEnzymes).forEach(([enzyme, site]) => {
        let pos = 0;
        const positions = [];
        // Find all occurrences
        while (pos !== -1) {
            pos = sequence.indexOf(site, pos);
            if (pos !== -1) {
                positions.push(pos + 1); // Convert to 1-indexed
                pos += 1;
            }
        }
        if (positions.length > 0) {
            result += `${enzyme} (${site}): ${positions.join(', ')}\n`;
        }
    });
    if (!result) {
        result = 'No common restriction sites found';
    }
    return result;
};
export const analyzePlasmidWithAI = async (store, userQuery, messageHistory = []) => {
    try {
        if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
            throw new Error('OpenAI API key is not configured. Please add your API key to the .env.local file.');
        }
        // Get plasmid data if available
        const plasmidData = getPlasmidDataForAI(store);
        // Prepare a proper message for the AI with or without plasmid data
        let userContent = userQuery;
        // If plasmid data is available and doesn't contain an error, include it
        if (plasmidData && !plasmidData.error) {
            // Prepare more structured and informative plasmid data
            let additionalInfo = "";
            let featuresSummary = "";
            // Check for features
            if (!plasmidData.features || plasmidData.features.length === 0) {
                additionalInfo = "Note: This sequence doesn't have any annotated features.";
            }
            else {
                // Create a detailed summary of the features
                featuresSummary = "\nFEATURE DETAILS:\n";
                // Group features by type for better organization
                const featuresByType = {};
                plasmidData.features.forEach(feature => {
                    const type = feature.type || "unknown";
                    if (!featuresByType[type])
                        featuresByType[type] = [];
                    featuresByType[type].push(feature);
                });
                // Process each type of feature
                Object.entries(featuresByType).forEach(([type, features]) => {
                    featuresSummary += `\n${type.toUpperCase()} FEATURES (${features.length}):\n`;
                    features.forEach((feature, index) => {
                        featuresSummary += `${index + 1}. ${feature.name}: position ${feature.start}-${feature.end}, ${feature.direction} strand, length ${feature.length} bp\n`;
                        // Add comprehensive notes if present
                        if (feature.notes && Object.keys(feature.notes).length > 0) {
                            featuresSummary += "   Annotations:\n";
                            Object.entries(feature.notes).forEach(([key, value]) => {
                                featuresSummary += `     - ${key}: ${value}\n`;
                            });
                        }
                        // Add gene info if present
                        if (feature.geneInfo && Object.keys(feature.geneInfo).length > 0) {
                            featuresSummary += "   Gene Information:\n";
                            Object.entries(feature.geneInfo).forEach(([key, value]) => {
                                featuresSummary += `     - ${key}: ${value}\n`;
                            });
                        }
                        // Include a small snippet of the feature sequence if available (first 30 bp)
                        if (feature.sequence) {
                            const displaySequence = feature.sequence.length > 30 ?
                                feature.sequence.substring(0, 30) + "..." : feature.sequence;
                            featuresSummary += `   Sequence (${feature.sequence.length} bp): ${displaySequence}\n`;
                        }
                        featuresSummary += "\n";
                    });
                });
            }
            // Build a more structured prompt with better organization of the data
            userContent = `Here is the plasmid currently loaded in the Recombyne editor:

PLASMID OVERVIEW:
- Name: ${plasmidData.name}
- Size: ${plasmidData.size} bp
- Topology: ${plasmidData.circular}
- GC Content: ${plasmidData.gcContent}
- Description: ${plasmidData.description || 'None provided'}
- Source: ${plasmidData.source || 'Unknown'}

The plasmid has ${plasmidData.features.length} features, ${plasmidData.parts.length} parts, and ${plasmidData.primers.length} primers.${featuresSummary}

MAP OF PLASMID ELEMENTS (simplified):
${generateSimplifiedPlasmidMap(plasmidData)}

RESTRICTION ENZYME SITES:
${identifyCommonRestrictionSites(plasmidData)}

${additionalInfo}

${userQuery}`;
        }
        // Create the request with the unified prompt and message history
        // Prepare conversation history for the API request
        const conversationMessages = [
            { role: 'system', content: UNIFIED_PROMPT }
        ];
        // Add previous messages to provide context
        if (messageHistory && messageHistory.length > 0) {
            // Skip the first AI message (welcome message) to save tokens
            const relevantHistory = messageHistory.slice(1);
            // Add each message from the history
            relevantHistory.forEach(msg => {
                conversationMessages.push({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                });
            });
        }
        // Add the current query
        conversationMessages.push({ role: 'user', content: userContent });
        console.log('Sending conversation history with prompt:', UNIFIED_PROMPT.substring(0, 200) + '...');
        const requestBody = {
            model: MODEL,
            messages: conversationMessages,
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
            }
            catch (e) {
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
    }
    catch (error) {
        console.error('Error processing with AI:', error);
        return `I'm having trouble processing your request due to an error: ${error.message}. Please try again or rephrase your question.`;
    }
};
export default {
    convertNaturalLanguageToEntrezParams,
    getPlasmidDataForAI,
    analyzePlasmidWithAI
};

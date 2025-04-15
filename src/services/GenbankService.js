/**
 * GenbankService.js
 * Handles the interaction with NCBI's Entrez API to import sequences from Genbank
 */
// Configuration
const ENTREZ_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const GENBANK_DATABASE = 'nucleotide';
const DEFAULT_RETURN_MAX = 3;
const EMAIL = process.env.REACT_APP_NCBI_EMAIL || 'your-email@example.com';
const TOOL_NAME = process.env.REACT_APP_NCBI_TOOL_NAME || 'recombyne-plasmid-editor';
const NCBI_API_KEY = process.env.REACT_APP_NCBI_API_KEY;
// Import the OpenAI service
import { convertNaturalLanguageToEntrezParams } from './OpenAIService';
/**
 * Search Genbank using Entrez ESearch API
 * @param {Object} searchParams - Parameters for the search
 * @returns {Promise<Object>} Search results with IDs
 */
export const searchGenbank = async (searchParams) => {
    try {
        const { term, organism, gene, maxResults = DEFAULT_RETURN_MAX, sort = 'relevance' } = searchParams;
        // Build the search term with specific organism and gene if provided
        let finalSearchTerm = term;
        // If organism and gene are provided separately but not already in the term
        if (organism && !term.includes(`${organism}[ORGN]`)) {
            finalSearchTerm = finalSearchTerm ? `${finalSearchTerm} AND ${organism}[ORGN]` : `${organism}[ORGN]`;
        }
        if (gene && !term.includes(`${gene}[GENE]`)) {
            finalSearchTerm = finalSearchTerm ? `${finalSearchTerm} AND ${gene}[GENE]` : `${gene}[GENE]`;
        }
        console.log('Final search term:', finalSearchTerm);
        // Build the ESearch URL
        const searchUrl = new URL(`${ENTREZ_BASE_URL}/esearch.fcgi`);
        searchUrl.searchParams.append('db', GENBANK_DATABASE);
        searchUrl.searchParams.append('term', finalSearchTerm);
        searchUrl.searchParams.append('retmax', maxResults);
        searchUrl.searchParams.append('sort', sort);
        searchUrl.searchParams.append('retmode', 'json');
        searchUrl.searchParams.append('tool', TOOL_NAME);
        searchUrl.searchParams.append('email', EMAIL);
        // Add API key if available
        if (NCBI_API_KEY) {
            searchUrl.searchParams.append('api_key', NCBI_API_KEY);
        }
        // Execute the search
        const response = await fetch(searchUrl);
        if (!response.ok) {
            throw new Error(`NCBI API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error searching Genbank:', error);
        throw error;
    }
};
/**
 * Fetch sequence details using Entrez EFetch API
 * @param {string[]} ids - Array of Genbank IDs to fetch
 * @returns {Promise<Object>} Detailed sequence information
 */
export const fetchSequenceDetails = async (ids) => {
    try {
        if (!ids || ids.length === 0) {
            throw new Error('No IDs provided for fetching sequence details');
        }
        // Build the EFetch URL
        const fetchUrl = new URL(`${ENTREZ_BASE_URL}/efetch.fcgi`);
        fetchUrl.searchParams.append('db', GENBANK_DATABASE);
        fetchUrl.searchParams.append('id', ids.join(','));
        fetchUrl.searchParams.append('rettype', 'gb');
        fetchUrl.searchParams.append('retmode', 'text');
        fetchUrl.searchParams.append('tool', TOOL_NAME);
        fetchUrl.searchParams.append('email', EMAIL);
        // Add API key if available
        if (NCBI_API_KEY) {
            fetchUrl.searchParams.append('api_key', NCBI_API_KEY);
        }
        // Execute the fetch
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`NCBI API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.text();
        return data;
    }
    catch (error) {
        console.error('Error fetching sequence details:', error);
        throw error;
    }
};
/**
 * Parse Genbank format to extract sequence and features
 * @param {string} genbankData - Raw Genbank format data
 * @returns {Object} Parsed sequence data in format compatible with editor
 */
export const parseGenbankData = (genbankData) => {
    try {
        // Basic parsing - in a real-world scenario, you'd use a more robust parser
        const lines = genbankData.split('\n');
        // Extract basic information
        let sequence = '';
        let features = [];
        let accession = '';
        let name = '';
        let organism = '';
        let inSequence = false;
        let inFeatures = false;
        let currentFeature = null;
        let featureCounter = 1;
        for (const line of lines) {
            // Extract accession
            if (line.startsWith('ACCESSION')) {
                accession = line.split('ACCESSION')[1].trim();
            }
            // Extract name/definition
            if (line.startsWith('DEFINITION')) {
                name = line.split('DEFINITION')[1].trim();
            }
            // Extract organism
            if (line.startsWith('  ORGANISM')) {
                organism = line.split('ORGANISM')[1].trim();
            }
            // Start of features section
            if (line.startsWith('FEATURES')) {
                inFeatures = true;
                continue;
            }
            // End of features section
            if (line.startsWith('ORIGIN')) {
                inFeatures = false;
                inSequence = true;
                continue;
            }
            // Feature parsing
            if (inFeatures && line.startsWith('     ')) {
                // Check if this is a new feature
                const featureMatch = line.match(/^     (\S+)\s+/);
                if (featureMatch) {
                    // This is a new feature definition line
                    const featureType = featureMatch[1];
                    // Get the location information from the rest of the line
                    const locationText = line.substring(featureMatch[0].length).trim();
                    // Handle different location formats
                    let start, end, forward = true;
                    // Simple range: 1..100
                    const simpleRange = locationText.match(/(\d+)\.\.(\d+)/);
                    if (simpleRange) {
                        start = parseInt(simpleRange[1], 10) - 1; // Convert to 0-based
                        end = parseInt(simpleRange[2], 10) - 1; // Convert to 0-based
                    }
                    // Complement range: complement(1..100)
                    const complementRange = locationText.match(/complement\((\d+)\.\.(\d+)\)/);
                    if (complementRange) {
                        start = parseInt(complementRange[1], 10) - 1;
                        end = parseInt(complementRange[2], 10) - 1;
                        forward = false;
                    }
                    // Create a new feature if we have start and end positions
                    if (start !== undefined && end !== undefined) {
                        currentFeature = {
                            id: `feature_${featureCounter++}`,
                            start,
                            end,
                            type: featureType,
                            name: `${featureType}_${start + 1}-${end + 1}`, // Default name
                            forward,
                            notes: {}
                        };
                        features.push(currentFeature);
                    }
                }
                else if (currentFeature && line.includes('/')) {
                    // This is a feature qualifier line
                    const qualifierMatch = line.match(/\/([^=]+)=?(.*)/);
                    if (qualifierMatch) {
                        const key = qualifierMatch[1].trim();
                        let value = qualifierMatch[2].trim();
                        // Handle quoted values
                        if (value.startsWith('"')) {
                            value = value.substring(1);
                            // If the value doesn't end with a quote, it might span multiple lines
                            if (!value.endsWith('"')) {
                                value = value + ' '; // Add space to separate from content in the next line
                            }
                            else {
                                value = value.substring(0, value.length - 1); // Remove trailing quote
                            }
                        }
                        // Special handling for important qualifiers
                        if (key === 'product' || key === 'gene' || key === 'label' || key === 'note') {
                            // Update the feature name with more descriptive information
                            if (value && value.length > 0) {
                                currentFeature.name = value;
                            }
                        }
                        // Save all qualifiers for reference
                        currentFeature.notes[key] = value;
                    }
                }
                else if (currentFeature && line.trim().startsWith('"')) {
                    // Continuation of a multi-line qualifier
                    // Get the last qualifier added
                    const lastQualifierKey = Object.keys(currentFeature.notes).pop();
                    if (lastQualifierKey) {
                        let continuationText = line.trim();
                        // Remove quotes if present
                        if (continuationText.endsWith('"')) {
                            continuationText = continuationText.substring(0, continuationText.length - 1);
                        }
                        if (continuationText.startsWith('"')) {
                            continuationText = continuationText.substring(1);
                        }
                        currentFeature.notes[lastQualifierKey] += continuationText;
                    }
                }
            }
            // Sequence parsing - only extract DNA sequence
            if (inSequence && !line.startsWith('//')) {
                // Extract sequence data (remove numbers and spaces)
                const seqLine = line.replace(/\d+|\s+/g, '');
                // Ensure we're only dealing with DNA sequences (ATGC)
                // Skip this line if it contains amino acid codes
                const isDnaSequence = /^[ATGCNatgcn]+$/.test(seqLine);
                if (isDnaSequence) {
                    sequence += seqLine;
                }
            }
            if (line.startsWith('//')) {
                inSequence = false;
            }
        }
        // Determine if sequence is likely circular (common for plasmids)
        const isCircular = name.toLowerCase().includes('plasmid') ||
            name.toLowerCase().includes('vector') ||
            name.toLowerCase().includes('circular');
        // Calculate some sequence properties for additional information
        const gcContent = calculateGCContent(sequence);
        return {
            sequenceData: {
                circular: isCircular, // Try to infer circularity
                sequence: sequence.toUpperCase(),
                features,
                name: name || accession,
                accession,
                organism, // Add organism information
                gcContent // Additional property
            }
        };
    }
    catch (error) {
        console.error('Error parsing Genbank data:', error);
        throw error;
    }
};
/**
 * Calculate GC content of a DNA sequence
 * @param {string} sequence - DNA sequence
 * @returns {number} GC content as percentage
 */
const calculateGCContent = (sequence) => {
    if (!sequence || sequence.length === 0)
        return 0;
    const gCount = (sequence.match(/g/gi) || []).length;
    const cCount = (sequence.match(/c/gi) || []).length;
    return ((gCount + cCount) / sequence.length * 100).toFixed(2);
};
/**
 * Convert natural language query to Entrez search parameters using OpenAI
 * @param {string} naturalLanguageQuery - User's query in natural language
 * @returns {Promise<Object>} Search parameters for Entrez API
 */
export const convertQueryToSearchParams = async (naturalLanguageQuery) => {
    try {
        console.log('Converting query to search parameters:', naturalLanguageQuery);
        // Use OpenAI directly to convert the query
        const result = await convertNaturalLanguageToEntrezParams(naturalLanguageQuery);
        if (!result || !result.searchParams) {
            throw new Error('Failed to convert query to search parameters');
        }
        console.log('OpenAI returned search parameters:', result.searchParams);
        return result.searchParams;
    }
    catch (error) {
        console.error('Error converting query to search params:', error);
        throw error;
    }
};
/**
 * Complete process to import sequence from Genbank based on natural language query
 * @param {string} naturalLanguageQuery - User's query in natural language
 * @returns {Promise<Object>} Array of sequence data results ready for the UI
 */
export const importSequenceFromGenbank = async (naturalLanguageQuery) => {
    try {
        // Step 1: Convert natural language to search parameters
        let searchParams;
        try {
            searchParams = await convertQueryToSearchParams(naturalLanguageQuery);
            console.log('Using search parameters:', JSON.stringify(searchParams));
        }
        catch (error) {
            console.error('Failed to convert query to search parameters:', error);
            throw new Error(`Failed to understand your query: ${error.message}. Please try rephrasing your request.`);
        }
        // Step 2: Search Genbank
        let searchResults;
        try {
            searchResults = await searchGenbank(searchParams);
        }
        catch (error) {
            console.error('Failed to search Genbank:', error);
            throw new Error(`Failed to search NCBI database: ${error.message}. This might be due to network issues or NCBI API limitations.`);
        }
        if (!searchResults.esearchresult || !searchResults.esearchresult.idlist || searchResults.esearchresult.idlist.length === 0) {
            throw new Error(`No sequences found matching your query "${naturalLanguageQuery}". Try:
1. Checking if the gene/organism names are spelled correctly
2. Using more specific search terms
3. Including both organism and gene names in your query
4. Using standard gene/protein names`);
        }
        console.log(`Found ${searchResults.esearchresult.idlist.length} results`);
        // Step 3: Fetch the top 3 sequences
        const top3SequenceIds = searchResults.esearchresult.idlist.slice(0, 3);
        // Step 4: Create array to store results
        const results = [];
        // Step 5: Process each sequence ID
        for (const id of top3SequenceIds) {
            console.log(`Fetching details for sequence ID: ${id}`);
            // Fetch details for this sequence
            let genbankData;
            try {
                genbankData = await fetchSequenceDetails([id]);
            }
            catch (error) {
                console.error(`Failed to fetch details for sequence ID ${id}:`, error);
                continue; // Skip this sequence and try the next one
            }
            // Parse the Genbank data to get only DNA sequences
            let sequenceData;
            try {
                sequenceData = parseGenbankData(genbankData);
            }
            catch (error) {
                console.error(`Failed to parse Genbank data for ID ${id}:`, error);
                continue; // Skip this sequence and try the next one
            }
            // Create the GenBank URL for this sequence
            const genbankUrl = `https://www.ncbi.nlm.nih.gov/nuccore/${id}`;
            sequenceData.genbankUrl = genbankUrl;
            // Verify we have a DNA sequence 
            if (sequenceData.sequenceData && sequenceData.sequenceData.sequence) {
                const sequence = sequenceData.sequenceData.sequence;
                // Check if it's a valid DNA sequence (contains only A, T, G, C, N)
                const isDnaSequence = /^[ATGCNatgcn]+$/.test(sequence);
                if (isDnaSequence) {
                    console.log(`Valid DNA sequence found for ID ${id}, length: ${sequence.length}`);
                    results.push(sequenceData);
                }
                else {
                    console.warn(`Sequence for ID ${id} is not a valid DNA sequence. It might be a protein sequence or contain invalid characters.`);
                    continue; // Skip this sequence and try the next one
                }
            }
            else {
                console.warn(`No sequence data found for ID ${id}. The record might be incomplete or not contain sequence information.`);
                continue; // Skip this sequence and try the next one
            }
        }
        if (results.length === 0) {
            throw new Error(`No valid DNA sequences found matching your query "${naturalLanguageQuery}". This could be because:
1. The sequences found were not in DNA format (they might be protein sequences)
2. The sequences contained invalid characters
3. The sequence records were incomplete
Try modifying your search terms or checking if you're looking for DNA or protein sequences.`);
        }
        return results;
    }
    catch (error) {
        console.error('Error importing sequence from Genbank:', error);
        throw error;
    }
};
export default {
    searchGenbank,
    fetchSequenceDetails,
    parseGenbankData,
    convertQueryToSearchParams,
    importSequenceFromGenbank
};

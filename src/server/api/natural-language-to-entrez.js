"use strict";
/**
 * API endpoint for converting natural language queries to Entrez search parameters
 *
 * NOTE: In a production environment, this would be a server-side endpoint.
 * For this demo, we're creating the file structure, but the actual implementation
 * would need to be adapted to your backend framework (Express, Next.js API routes, etc.)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const OpenAIService_1 = require("../../services/OpenAIService");
/**
 * Handler for the natural-language-to-entrez API endpoint
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }
        const { query } = req.body;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query is required and must be a string' });
        }
        const result = await (0, OpenAIService_1.convertNaturalLanguageToEntrezParams)(query);
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Error in natural-language-to-entrez API:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

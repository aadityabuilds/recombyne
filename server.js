// Load environment variables
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const dnaOptimization = require('./src/server/api/dna-optimization');

// Initialize express
const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.post('/api/dna-optimization', dnaOptimization);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
  console.log(`Python path: ${process.env.PYTHONPATH || 'Not set'}`);
}); 
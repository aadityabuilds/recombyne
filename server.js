// Load environment variables
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const { securityMiddleware } = require('./src/server/config/security');
const dnaOptimization = require('./src/server/api/dna-optimization');

// Initialize express
const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.path.includes('dna-optimization')) {
    console.log('DNA Optimization Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Security middleware
app.use(securityMiddleware);

// Enable CORS with specific options
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON with size limits
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

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
  console.log('Environment:', process.env.NODE_ENV || 'development');
}); 
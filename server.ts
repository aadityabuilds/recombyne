// Load environment variables
import 'dotenv/config';
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as cors from 'cors';
import dnaOptimization from './src/server/api/dna-optimization';

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
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
// DNA Optimization API
// This endpoint bridges the frontend with the DNAChisel Python service

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

/**
 * Optimizes a DNA sequence using DNAChisel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      sequence, 
      constraints = [], 
      objectives = [],
      isCircular = false 
    } = req.body;

    if (!sequence) {
      return res.status(400).json({ error: 'Sequence is required' });
    }

    // Validate sequence length
    console.log(`Processing sequence of length: ${sequence.length}`);
    if (sequence.length > 100000) {
      return res.status(400).json({ 
        error: 'Sequence too long', 
        details: 'Sequences longer than 100,000 bp are not supported for optimization'
      });
    }

    // Log constraints and objectives for debugging
    console.log('Constraints:', JSON.stringify(constraints.map(c => c.type)));
    console.log('Objectives:', JSON.stringify(objectives.map(o => o.type)));

    // Create a temp directory for the files
    const tempDir = path.join(os.tmpdir(), 'recombyne-dnachisel');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const jobId = uuidv4();
    const inputFile = path.join(tempDir, `${jobId}-input.json`);
    const outputFile = path.join(tempDir, `${jobId}-output.json`);

    // Prepare input data for the Python script
    const inputData = {
      sequence,
      constraints,
      objectives,
      isCircular,
    };

    // Write input data to temp file
    fs.writeFileSync(inputFile, JSON.stringify(inputData));

    // Path to Python script
    const pythonScript = path.join(process.cwd(), 'src', 'server', 'python', 'dna_optimization.py');

    console.log('Running DNA optimization with input file:', inputFile);
    console.log('Using Python script at:', pythonScript);
    
    return new Promise((resolve, reject) => {
      // Run the Python script
      // Verify Python script exists
      if (!fs.existsSync(pythonScript)) {
        console.error('Python script not found at:', pythonScript);
        return res.status(500).json({ error: 'DNA optimization script not found' });
      }
      
      // Log the contents of the input file for debugging
      console.log('Input file content length:', fs.readFileSync(inputFile, 'utf8').length);
      
      const pythonProcess = spawn('python3', [pythonScript, inputFile, outputFile]);
      
      let errorData = '';
      pythonProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        console.error('Python stderr:', chunk);
        errorData += chunk;
      });

      let stdoutData = '';
      pythonProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        console.log('Python stdout:', chunk);
        stdoutData += chunk;
      });

      pythonProcess.on('close', (code) => {
        console.log('Python process exited with code', code);
        
        if (code !== 0) {
          console.error('Error during Python execution:', errorData);
          
          // Extract specific error message if available
          let detailedError = errorData;
          const errorMatch = errorData.match(/Error[^:]*:\s*([^\n]+)/);
          if (errorMatch && errorMatch[1]) {
            detailedError = errorMatch[1].trim();
          }
          
          return res.status(500).json({ 
            error: 'DNA optimization failed', 
            details: detailedError || 'Python process exited with an error'
          });
        }

        // Read the output file
        try {
          console.log('Reading output file:', outputFile);
          const fileExists = fs.existsSync(outputFile);
          console.log('Output file exists:', fileExists);
          
          if (!fileExists) {
            console.error('Output file does not exist, stdout:', stdoutData);
            console.error('stderr:', errorData);
            return res.status(500).json({ 
              error: 'DNA optimization failed', 
              details: 'Output file was not created' 
            });
          }
          
          const fileContent = fs.readFileSync(outputFile, 'utf8');
          console.log('File content length:', fileContent.length);
          
          if (!fileContent || fileContent.trim() === '') {
            console.error('Empty output file');
            return res.status(500).json({ 
              error: 'DNA optimization failed', 
              details: 'Output file is empty' 
            });
          }
          
          try {
            const outputData = JSON.parse(fileContent);
            console.log('Successfully parsed output JSON');
            
            // Check for error in the returned data
            if (outputData.success === false) {
              console.error('Optimization error from Python:', outputData.error);
              return res.status(500).json({
                error: 'DNA optimization failed',
                details: outputData.error || 'Unknown error during optimization',
                traceback: outputData.traceback
              });
            }
            
            // Clean up temp files
            try {
              fs.unlinkSync(inputFile);
              fs.unlinkSync(outputFile);
            } catch (cleanupErr) {
              console.warn('Error cleaning up temp files:', cleanupErr);
            }
            
            // Send the parsed output data to the client
            return res.status(200).json(outputData);
          } catch (parseError) {
            console.error('JSON parse error:', parseError.message);
            console.error('Raw file content:', fileContent);
            return res.status(500).json({
              error: 'Failed to parse optimization results',
              details: `JSON parse error: ${parseError.message}`,
              raw: fileContent.substring(0, 200) // Include beginning of file content for debugging
            });
          }

        } catch (err) {
          console.error('Failed to read or parse output file:', err);
          console.error('Error details:', err.message);
          return res.status(500).json({ 
            error: 'Failed to read optimization results',
            details: err.message 
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in DNA optimization handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

module.exports = handler;

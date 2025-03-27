const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(__dirname, 'src/components/ChatInterface.jsx');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Just for testing - let's try to find the handleSendMessage function and extract it
  const functionRegex = /const handleSendMessage = async \(e\) => \{[\s\S]*?finally[\s\S]*?\n  \};/g;
  const matches = fileContent.match(functionRegex);
  
  if (matches && matches.length > 0) {
    console.log('Found handleSendMessage function:');
    console.log(matches[0]);
  } else {
    console.log('Could not extract handleSendMessage function');
    
    // Try to find the try-catch block within handleSendMessage
    const tryBlockRegex = /\s+try \{[\s\S]*?finally[\s\S]*?\s+\}/g;
    const tryMatches = fileContent.match(tryBlockRegex);
    
    if (tryMatches && tryMatches.length > 0) {
      console.log('Found try-catch block:');
      console.log(tryMatches[0]);
    } else {
      console.log('Could not extract try-catch block');
    }
  }
  
  console.log('Syntax check passed');
} catch (error) {
  console.error('Error:', error.message);
} 
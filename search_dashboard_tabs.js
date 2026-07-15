const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Siva\\\.gemini\\antigravity\\scratch\\gta-hub-store\\src\\app\\dashboard\\page.tsx', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('activeTab') || line.includes('tickets')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});

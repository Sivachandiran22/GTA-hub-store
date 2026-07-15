const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      searchDir(fullPath, query);
    } else if (stats.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(query)) {
        console.log(`Found "${query}" in ${fullPath}`);
      }
    }
  });
}

searchDir('C:\\Users\\Siva\\.gemini\\antigravity\\scratch\\gta-hub-store\\src', 'paymentGateway');

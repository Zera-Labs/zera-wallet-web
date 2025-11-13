const fs = require('fs');
const path = require('path');

const version = process.argv[2];

if (!version) {
  console.error('Usage: node .versioning/prepare.js <version>');
  process.exit(1);
}

fs.writeFileSync('VERSION', version + '\n');

fs.mkdirSync('.versioning', { recursive: true });
const historyPath = path.join('.versioning', 'history.json');

let history = [];
if (fs.existsSync(historyPath)) {
  history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
}

history.push({
  version,
  date: new Date().toISOString()
});

fs.writeFileSync(historyPath, JSON.stringify(history, null, 2) + '\n');

if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = version;
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
}

console.log(`Updated VERSION, .versioning/history.json and package.json to ${version}`);

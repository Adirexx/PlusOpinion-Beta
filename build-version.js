const fs = require('fs');
const path = require('path');

// Generate version based on timestamp
const timestamp = Date.now().toString();
const buildNumber = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_REF || 'local';

console.log(`🔨 Building PlusOpinion version: ${timestamp}`);
console.log(`📦 Build number: ${buildNumber}`);

// Update version.json
let major = false;
let maintenance = false;

try {
    const existing = JSON.parse(fs.readFileSync(path.join(__dirname, 'version.json'), 'utf8'));
    major = existing.major || false;
    maintenance = existing.maintenance || false;
} catch (e) {
    // Default values if file doesn't exist
}

const versionData = {
    version: timestamp,
    major: major,
    maintenance: maintenance,
    build: buildNumber,
    timestamp: new Date().toISOString()
};

fs.writeFileSync(
    path.join(__dirname, 'version.json'),
    JSON.stringify(versionData, null, 2)
);

// Update service-worker.js with version
let swContent = fs.readFileSync(
    path.join(__dirname, 'service-worker.js'),
    'utf8'
);

const date = new Date();
const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

swContent = swContent.replace(
    /'BUILD_\d{8}_MAJOR_V\d+\.\d+'/,
    `'BUILD_${dateStr}_MAJOR_V2.9'`
);

fs.writeFileSync(
    path.join(__dirname, 'service-worker.js'),
    swContent
);

console.log('✅ Version injection complete');
console.log(`📝 Version: ${timestamp}`);
console.log(`🚀 Ready for deployment`);

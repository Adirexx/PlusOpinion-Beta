const fs = require('fs');
const path = require('path');

// Generate version based on timestamp
const timestamp = Date.now().toString();
const buildNumber = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_REF || 'local';

console.log(`🔨 Building PlusOpinion version: ${timestamp}`);
console.log(`📦 Build number: ${buildNumber}`);

// Update version.json
const versionData = {
    version: timestamp,
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

swContent = swContent.replace(
    /const VERSION = .*'BUILD_TIMESTAMP_PLACEHOLDER'.*/,
    `const VERSION = '${timestamp}';`
);

fs.writeFileSync(
    path.join(__dirname, 'service-worker.js'),
    swContent
);

console.log('✅ Version injection complete');
console.log(`📝 Version: ${timestamp}`);
console.log(`🚀 Ready for deployment`);

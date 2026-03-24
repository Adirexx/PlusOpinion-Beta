const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const dir = __dirname;
const distDir = path.join(dir, 'dist');

if (!fs.existsSync(distDir)) {
    console.error("❌ Dist directory not found! Run from project root.");
    process.exit(1);
}

const jsxFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.jsx'));

console.log(`Found ${jsxFiles.length} JSX components. Starting compilation...`);

for (const file of jsxFiles) {
    const jsxPath = path.join(distDir, file);
    const compiledPath = path.join(distDir, file.replace('.jsx', '.compiled.js'));
    
    let content = fs.readFileSync(jsxPath, 'utf8');

    try {
        const transformed = babel.transformSync(content, {
            presets: ['@babel/preset-react'],
            retainLines: true, // helpful for debugging error line numbers
            sourceMaps: false
        });

        fs.writeFileSync(compiledPath, transformed.code);
        console.log(`✅ ${file} -> ${path.basename(compiledPath)}`);
    } catch (err) {
        console.error(`❌ Failed to compile ${file}:`, err.message);
    }
}

console.log('🚀 SPA React Compilation Complete.');

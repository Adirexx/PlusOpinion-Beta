const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.toUpperCase().endsWith('.HTML') && f !== 'index-old-design.html');

for (const file of htmlFiles) {
    if (file === 'HOMEPAGE_FINAL.HTML') continue;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    const replacer = (regex, replacement) => {
        if (regex.test(content)) {
            content = content.replace(regex, replacement);
            changed = true;
        }
    };

    replacer(/\.ambient-bg\s*\{[\s\S]*?\}/g, `.ambient-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: 
                radial-gradient(circle at 0% 0%, rgba(47, 139, 255, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 100% 100%, rgba(79, 70, 229, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 50% 0%, #0a0e1c 0%, var(--bg-deep) 80%);
            z-index: -2;
            pointer-events: none;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            perspective: 1000px;
        }`);

    replacer(/\.orb\s*\{[\s\S]*?\}/g, `.orb { display: none; }`);
    replacer(/\.orb-1\s*\{[\s\S]*?\}/g, `.orb-1 { display: none; }`);
    replacer(/\.orb-2\s*\{[\s\S]*?\}/g, `.orb-2 { display: none; }`);

    replacer(/#root\s*\{[\s\S]*?\}/g, `#root {
            width: 100%;
            height: 100%;
            max-width: 450px;
            background-color: rgba(3, 4, 18, 0.85); 
            position: relative;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 80px rgba(0, 0, 0, 0.8);
            overflow: hidden;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
        }`);

    replacer(/\.glass-card\s*\{[\s\S]*?\}/g, `.glass-card {
            background: rgba(20, 25, 35, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            transition: all 0.3s ease;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            will-change: transform;
        }`);

    replacer(/\.nav-glass\s*\{[\s\S]*?\}/g, `.nav-glass {
            background: rgba(3, 4, 18, 0.95);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid var(--glass-border);
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
        }`);

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Applied GPU acceleration to: ${file}`);
    }
}

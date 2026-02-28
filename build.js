const fs = require('fs');
const path = require('path');

const filesToCopy = ['index.html', 'style.css', 'app.js', 'stopwatch.png'];
const distDir = path.join(__dirname, 'dist');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

filesToCopy.forEach(file => {
    fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
});

console.log('✅ Arquivos web copiados para a pasta dist/');

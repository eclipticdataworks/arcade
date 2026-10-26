const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/zyany/.gemini/antigravity/scratch/shiba-pacman';
const artifactDir = 'C:/Users/zyany/.gemini/antigravity/brain/dd191095-b094-44ca-b0be-77a2a83d3538';

const css = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
const audio = fs.readFileSync(path.join(dir, 'audio.js'), 'utf8');
const maze = fs.readFileSync(path.join(dir, 'maze.js'), 'utf8');
const shiba = fs.readFileSync(path.join(dir, 'shiba.js'), 'utf8');
const squirrel = fs.readFileSync(path.join(dir, 'squirrel.js'), 'utf8');
const game = fs.readFileSync(path.join(dir, 'game.js'), 'utf8');
const main = fs.readFileSync(path.join(dir, 'main.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

// Replace external link tags and script tags with inline versions
let bundled = indexHtml
  .replace('<link rel="stylesheet" href="style.css">', `<style>\n${css}\n</style>`)
  .replace(
    /  <script src="audio\.js"><\/script>[\s\S]*?<script src="main\.js"><\/script>/,
    `<script>\n${audio}\n${maze}\n${shiba}\n${squirrel}\n${game}\n${main}\n</script>`
  );

// Ensure artifactDir exists
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

fs.writeFileSync(path.join(dir, 'standalone.html'), bundled, 'utf8');
fs.writeFileSync(path.join(artifactDir, 'game.html'), bundled, 'utf8');

console.log('Successfully bundled into standalone.html and artifact game.html! Total size:', bundled.length, 'bytes');

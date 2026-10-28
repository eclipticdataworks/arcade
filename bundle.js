const fs = require('fs');
const path = require('path');

// Resolve paths relative to repository directory
const dir = __dirname;
const artifactDir = process.env.ARTIFACT_DIR || null;

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

fs.writeFileSync(path.join(dir, 'standalone.html'), bundled, 'utf8');
console.log('Successfully written standalone.html in repository root! Size:', bundled.length, 'bytes');

// Optionally write to artifactDir if it exists or is configured
if (artifactDir) {
  try {
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
    fs.writeFileSync(path.join(artifactDir, 'game.html'), bundled, 'utf8');
    console.log('Successfully written artifact game.html!');
  } catch (err) {
    console.warn('Could not write to artifactDir:', err.message);
  }
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRESETS_DIR = path.join(__dirname, '../public/presets');
const CLOUD_NAME = 'dgvthwz6h';
const CLOUDINARY_PREFIX = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/`;

function migrateJsonFiles() {
  const files = fs.readdirSync(PRESETS_DIR).filter(file => file.endsWith('.json'));

  files.forEach(file => {
    const filePath = path.join(PRESETS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Robust regex to find all occurrences of visuals/...png and replace with Cloudinary URL
    // Handles ./visuals, /visuals, and already-migrated but potentially malformed URLs.
    const finalContent = content.replace(/(?:\.\/|\/|\.https?:\/\/[^"]*|https?:\/\/[^"]*)visuals\/(.*?\.png)/g, (match, p1) => {
        return `${CLOUDINARY_PREFIX}visuals/${p1}`;
    });

    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`Migrated ${file}`);
  });
}

migrateJsonFiles();
console.log('Migration complete.');

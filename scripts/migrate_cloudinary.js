import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRESETS_DIR = path.join(__dirname, '../public/presets');
const CLOUD_NAME = 'dgvthwz6h';
const CLOUDINARY_PREFIX = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1774380691/`;

function migrateJsonFiles() {
  const files = fs.readdirSync(PRESETS_DIR).filter(file => file.endsWith('.json'));

  files.forEach(file => {
    const filePath = path.join(PRESETS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Updated regex to capture ONLY the filename from any existing path (local or old Cloudinary)
    // and prepending the new Cloudinary root prefix.
    const finalContent = content.replace(/(?:\.\/|\/|https?:\/\/res\.cloudinary\.com\/[^"\/]+\/image\/upload\/v\d+\/(?:visuals\/)?)(?:[^"]*\/)?([^"\/]+\.png)/g, (match, filename) => {
        return `${CLOUDINARY_PREFIX}${filename}`;
    });

    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`Migrated ${file}`);
  });
}

migrateJsonFiles();
console.log('Migration complete.');

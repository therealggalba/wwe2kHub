import { db } from './src/db/db';

async function exportFullDB() {
  const data = {
    brands: await db.brands.toArray(),
    wrestlers: await db.wrestlers.toArray(),
    championships: await db.championships.toArray(),
    npcs: await db.npcs.toArray(),
    settings: await db.settings.toArray(),
    shows: await db.shows.toArray() // We might want to keep history or not, let's include it for now
  };
  console.log(JSON.stringify(data, null, 2));
}

exportFullDB();

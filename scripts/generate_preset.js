import fs from 'fs';

function extractArray(content, name) {
  const startIdx = content.indexOf(`const ${name} = [`);
  if (startIdx === -1) return [];
  // Find the closing ]; of the array
  let bracketCount = 0;
  let i = content.indexOf('[', startIdx);
  let start = i;
  for (; i < content.length; i++) {
    if (content[i] === '[') bracketCount++;
    else if (content[i] === ']') bracketCount--;
    if (bracketCount === 0) break;
  }
  const arrayStr = content.substring(start, i + 1);
  // Clean TS annotations within the array string
  const cleaned = arrayStr
    .replace(/:\s*\w+(\[\])?/g, '')
    .replace(/\s+as\s+\w+(\[\])?/g, '');
  
  // Use Function instead of eval for safer/cleaner ESM context
  // wrap it in a return statement
  return new Function(`return ${cleaned}`)();
}

const wrestlersRaw = fs.readFileSync('src/db/seeds/wwe/wrestlers.ts', 'utf8');
const chipsRaw = fs.readFileSync('src/db/seeds/wwe/championships.ts', 'utf8');
const showsRaw = fs.readFileSync('src/db/seeds/wwe/shows.ts', 'utf8');

const WRESTLERS_SEED = extractArray(wrestlersRaw, 'WRESTLERS_SEED');
const CHAMPIONSHIPS_SEED = extractArray(chipsRaw, 'CHAMPIONSHIPS_SEED');
const SHOWS_SEED = extractArray(showsRaw, 'SHOWS_SEED');

const brandMap = {
  'RAW': 1,
  'SMACKDOWN': 2,
  'NXT': 3,
  'SHARED': null
};

const brands = [
  { id: 1, name: 'RAW', primaryColor: '#FF0000', secondaryColor: '#000000', logo: '/visuals/Brands/raw.png', priority: 1, isMajorBrand: true, isShared: false },
  { id: 2, name: 'SMACKDOWN', primaryColor: '#0000FF', secondaryColor: '#000000', logo: '/visuals/Brands/smackdown.png', priority: 2, isMajorBrand: true, isShared: false },
  { id: 3, name: 'NXT', primaryColor: '#FFFF00', secondaryColor: '#000000', logo: '/visuals/Brands/nxt.png', priority: 3, isMajorBrand: true, isShared: false }
];

const wrestlers = WRESTLERS_SEED.map((w, index) => ({
  id: index + 1,
  ...w,
  brandId: brandMap[w.brandName] || 1,
  injuryWeeks: 0,
  moral: 100
}));

const championships = CHAMPIONSHIPS_SEED.map((c, index) => {
  const champion = wrestlers.find(w => w.holdsTitleNames?.includes(c.name));
  return {
    id: index + 1,
    name: c.name,
    image: c.image,
    brandId: brandMap[c.brandName] || 1,
    currentChampionId: champion ? champion.id : null,
    history: []
  };
});

wrestlers.forEach(w => {
  w.currentTitlesIds = championships.filter(c => c.currentChampionId === w.id).map(c => c.id);
  delete w.brandName;
  delete w.holdsTitleNames;
});

const shows = SHOWS_SEED.map((s, index) => ({
  id: index + 1,
  ...s,
  brandId: brandMap[s.brandName] || null
}));
shows.forEach(s => delete s.brandName);

const finalData = {
  brands,
  wrestlers,
  championships,
  npcs: [],
  settings: [
    { key: 'enableInjuries', value: true },
    { key: 'enableMorale', value: true },
    { key: 'weeksPerSeason', value: 52 }
  ],
  shows
};

fs.writeFileSync('public/presets/wwe_universe.json', JSON.stringify(finalData, null, 2));
console.log('wwe_universe.json generated successfully!');

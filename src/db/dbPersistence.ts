import { db } from './db';
import type { Brand, Wrestler, Championship, NPC, Show } from '../models/types';

export interface FullDatabaseState {
  brands: Brand[];
  wrestlers: Wrestler[];
  championships: Championship[];
  npcs: NPC[];
  settings: { key: string; value: unknown }[];
  shows: Show[];
  [key: string]: unknown;
}

export const validateUniverseData = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  
  const requiredKeys = ['brands', 'wrestlers', 'championships'];
  for (const key of requiredKeys) {
    if (!Array.isArray(d[key])) {
      console.error(`Missing or invalid required array: ${key}`);
      return false;
    }
  }
  return true;
};

export const exportState = async (): Promise<FullDatabaseState> => {
  return {
    brands: await db.brands.toArray(),
    wrestlers: await db.wrestlers.toArray(),
    championships: await db.championships.toArray(),
    npcs: await db.npcs.toArray(),
    settings: await db.settings.toArray(),
    shows: await db.shows.toArray(),
  };
};

export const importState = async (state: Partial<FullDatabaseState>) => {
  if (!validateUniverseData(state)) {
    throw new Error('Invalid universe data format. Required fields missing.');
  }
  await db.transaction('rw', [db.brands, db.wrestlers, db.championships, db.npcs, db.settings, db.shows], async () => {
    // Clear existing data
    await db.brands.clear();
    await db.wrestlers.clear();
    await db.championships.clear();
    await db.npcs.clear();
    await db.settings.clear();
    await db.shows.clear();

    // 1. Import Brands first and preserve IDs
    const brandMap = new Map<string, number>();
    if (state.brands && state.brands.length > 0) {
      for (const brandData of (state.brands as Brand[])) {
        // Use add() which preserves ID if present, or generates one if not
        const id = await db.brands.add(brandData);
        brandMap.set(brandData.name, id);
      }
    }

    // 2. Import Championships (preserving IDs and mapping brandId if needed)
    const titleMap = new Map<string, number>();
    if (state.championships && state.championships.length > 0) {
      for (const titleData of (state.championships as (Championship & { brandName?: string })[])) {
        const championshipId = await db.championships.add({
          ...titleData,
          brandId: titleData.brandId || (titleData.brandName ? brandMap.get(titleData.brandName) : undefined),
        } as Championship);
        titleMap.set(titleData.name, championshipId);
      }
    }

    // 3. Import Wrestlers (preserving IDs and mapping brandId/titles if needed)
    if (state.wrestlers && state.wrestlers.length > 0) {
      const wrestlersWithMappedIds: Wrestler[] = (state.wrestlers as (Wrestler & { holdsTitleNames?: string[], brandName?: string })[]).map((w) => {
        // Map titles from names ONLY if we need to (e.g. from a Preset)
        const titles: number[] = [...(w.currentTitlesIds || [])];
        if (w.holdsTitleNames && Array.isArray(w.holdsTitleNames)) {
          w.holdsTitleNames.forEach((tName: string) => {
            const tId = titleMap.get(tName);
            if (tId && !titles.includes(tId)) titles.push(tId);
          });
        }

        return {
          ...w,
          brandId: w.brandId || (w.brandName ? brandMap.get(w.brandName) : undefined),
          currentTitlesIds: titles,
          wins: w.wins ?? 0,
          losses: w.losses ?? 0,
          draws: w.draws ?? 0,
          historicalTitlesIds: w.historicalTitlesIds ?? [],
          injuryStatus: w.injuryStatus ?? "None",
          injuryWeeks: w.injuryWeeks ?? 0,
          moral: w.moral ?? 80,
          matchesSeason: w.matchesSeason ?? 0,
          isActive: w.isActive ?? true,
          contract: w.contract ?? "Full-time",
          rating: w.rating ?? 80,
          alignment: w.alignment ?? "Face",
          faction: w.faction ?? ""
        } as Wrestler;
      });
      await db.wrestlers.bulkAdd(wrestlersWithMappedIds);
    }

    // 4. Import NPCs (preserving IDs and mapping brandId)
    if (state.npcs && (state.npcs as NPC[]).length > 0) {
      const npcsWithMappedIds = (state.npcs as (Partial<NPC> & { brandName?: string })[]).map((n) => ({
        ...n,
        brandId: n.brandId || (n.brandName ? brandMap.get(n.brandName) : undefined)
      })) as NPC[];
      await db.npcs.bulkAdd(npcsWithMappedIds);
    }

    // 5. Import Settings
    if (state.settings && state.settings.length > 0) {
      await db.settings.bulkAdd(state.settings);
    }
    
    // 6. Import Shows (preserving IDs and mapping brandId)
    if (state.shows && state.shows.length > 0) {
      const showsWithMappedIds = (state.shows as (Partial<Show> & { brandName?: string })[]).map((s) => ({
        ...s,
        date: s.date ? new Date(s.date) : new Date(),
        brandId: s.brandId || (s.brandName ? brandMap.get(s.brandName) : undefined)
      })) as Show[];
      await db.shows.bulkAdd(showsWithMappedIds);
    }
  });
};

export const saveToSlot = async (name: string) => {
  const data = await exportState();
  await db.save_slots.add({
    name,
    data,
    timestamp: new Date()
  });
};

export const loadFromSlot = async (slotId: number) => {
  const slot = await db.save_slots.get(slotId);
  if (!slot) throw new Error('Slot not found');
  await importState(slot.data as Partial<FullDatabaseState>);
};

export const getSaveSlots = async () => {
  return await db.save_slots.toArray();
};

export const deleteSlot = async (id: number) => {
  await db.save_slots.delete(id);
};

export const isDatabaseEmpty = async (): Promise<boolean> => {
  const brandCount = await db.brands.count();
  return brandCount === 0;
};

export const clearAllData = async () => {
  await db.transaction('rw', [db.brands, db.wrestlers, db.championships, db.npcs, db.settings, db.shows], async () => {
    await db.brands.clear();
    await db.wrestlers.clear();
    await db.championships.clear();
    await db.npcs.clear();
    await db.settings.clear();
    await db.shows.clear();
  });
};

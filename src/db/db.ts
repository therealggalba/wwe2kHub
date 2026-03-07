import Dexie, { type Table } from 'dexie';
import type { Wrestler, Show, Brand, Championship, NPC } from '../models/types';

export class WWE2kDatabase extends Dexie {
  wrestlers!: Table<Wrestler>;
  shows!: Table<Show>;
  brands!: Table<Brand>;
  championships!: Table<Championship>;
  npcs!: Table<NPC>;
  settings!: Table<{ key: string, value: any }>;

  constructor() {
    super('WWE2kDatabase');
    this.version(6).stores({
      wrestlers: '++id, name, brandId, rating, gender, alignment, moral, matchesSeason, isActive, *currentTitlesIds',
      shows: '++id, name, date, brandId, type',
      brands: '++id, name, logo',
      championships: '++id, name, brandId, currentChampionId',
      npcs: '++id, name, brandId, role',
      settings: 'key'
    });
  }
}

export const db = new WWE2kDatabase();

import Dexie, { type Table } from 'dexie';
import type { Wrestler, Show, Brand, Championship, NPC } from '../models/types';
import type { FullDatabaseState } from './dbPersistence';

export class WWE2kDatabase extends Dexie {
  wrestlers!: Table<Wrestler>;
  shows!: Table<Show>;
  brands!: Table<Brand>;
  championships!: Table<Championship>;
  npcs!: Table<NPC>;
  settings!: Table<{ key: string, value: unknown }>;
  save_slots!: Table<{ id?: number, name: string, data: FullDatabaseState, timestamp: Date }>;

  constructor() {
    super('WWE2kDatabase');
    this.version(7).stores({
      wrestlers: '++id, name, brandId, rating, gender, alignment, moral, matchesSeason, isActive, *currentTitlesIds',
      shows: '++id, name, date, brandId, type',
      brands: '++id, name, logo',
      championships: '++id, name, brandId, currentChampionId',
      npcs: '++id, name, brandId, role',
      settings: 'key',
      save_slots: '++id, name, timestamp'
    });
  }
}

export const db = new WWE2kDatabase();

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import type { Match } from '../models/types';

describe('Extended Database Schema', () => {
  beforeEach(async () => {
    await db.wrestlers.clear();
    await db.shows.clear();
    await db.brands.clear();
    await db.championships.clear();
    await db.npcs.clear();
  });

  it('should handle complex Brand, Wrestler and Show relationships', async () => {
    // 1. Create a Brand
    const rawId = await db.brands.add({
      name: 'RAW',
      primaryColor: '#FF0000',
      secondaryColor: '#FFFFFF',
      arena: 'Monday Night RAW Arena'
    });

    // 2. Add a Wrestler to that Brand
    const wrestlerId = await db.wrestlers.add({
      name: 'Seth Rollins',
      brandId: rawId,
      wins: 10,
      losses: 2,
      draws: 0,
      currentTitlesIds: [],
      historicalTitlesIds: [],
      injuryStatus: 'None',
      moral: 90,
      contract: 'Full-time',
      rating: 93,
      gender: 'Male'
    });

    // 3. Create a Championship
    const titleId = await db.championships.add({
      name: 'World Heavyweight Championship',
      currentChampionId: wrestlerId,
      brandId: rawId,
      history: [
        { wrestlerName: 'Seth Rollins', reignNumber: 1, totalWeeks: 20 }
      ]
    });

    // 4. Create a Show with a Card
    const showId = await db.shows.add({
      name: 'RAW Episode 1',
      date: new Date(),
      brandId: rawId,
      type: 'Weekly',
      valuation: 0,
      card: {
        segments: [
          {
            type: 'Match',
            data: {
              titleMatch: true,
              championshipId: titleId,
              type: 'Singles',
              participantsIds: [wrestlerId, 999], // 999 is dummy id
              winnersIds: [wrestlerId],
              rating: 4.5
            }
          }
        ]
      }
    });

    // Verifications
    const savedWrestler = await db.wrestlers.get(wrestlerId!);
    expect(savedWrestler?.brandId).toBe(rawId);

    const savedTitle = await db.championships.get(titleId!);
    expect(savedTitle?.currentChampionId).toBe(wrestlerId);

    const savedShow = await db.shows.get(showId!);
    expect(savedShow?.card?.segments[0].type).toBe('Match');
    expect((savedShow?.card?.segments[0].data as Match).rating).toBe(4.5);
  });

  it('should handle NPCs', async () => {
    const npcId = await db.npcs.add({
      name: 'Adam Pearce',
      role: 'General Manager',
      brandId: 1
    });

    const savedNpc = await db.npcs.get(npcId!);
    expect(savedNpc?.name).toBe('Adam Pearce');
  });
});

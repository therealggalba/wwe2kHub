import type { BrandName } from '../../models/types';

export interface SeedShow {
  name: string;
  brandName: BrandName | 'SHARED';
  type: 'Weekly' | 'PLE' | 'Special';
  valuation: number;
}

export const SHOWS_SEED: SeedShow[] = [
  { name: 'Monday Night RAW', brandName: 'RAW', type: 'Weekly', valuation: 80 },
  { name: 'Friday Night SmackDown', brandName: 'SMACKDOWN', type: 'Weekly', valuation: 85 },
  { name: 'NXT', brandName: 'NXT', type: 'Weekly', valuation: 75 },
  { name: 'WrestleMania', brandName: 'SHARED', type: 'PLE', valuation: 95 },
];

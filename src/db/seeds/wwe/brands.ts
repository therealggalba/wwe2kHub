import { GAME_CONFIG } from '../../../config/gameConfig';
import type { BrandName } from '../../../models/types';

export interface SeedBrand {
  name: BrandName;
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  priority: number;
  isMajorBrand: boolean;
  isShared: boolean;
}

export const BRANDS_SEED: SeedBrand[] = GAME_CONFIG.brands.map(b => ({
  name: b.name,
  primaryColor: b.primaryColor,
  secondaryColor: b.secondaryColor,
  logo: b.logo,
  priority: b.priority,
  isMajorBrand: b.isMajorBrand,
  isShared: b.isShared
}));

import type { BrandName } from '../../models/types';

export interface SeedBrand {
  name: BrandName;
  primaryColor: string;
  secondaryColor: string;
  logo: string;
}

export const BRANDS_SEED: SeedBrand[] = [
  {
    name: 'RAW',
    primaryColor: '#e00012',
    secondaryColor: '#000000',
    logo: './visuals/Brands/raw.png',
  },
  {
    name: 'SMACKDOWN',
    primaryColor: '#0070bb',
    secondaryColor: '#000000',
    logo: './visuals/Brands/smackdown.png',
  },
  {
    name: 'NXT',
    primaryColor: '#e7b512ff',
    secondaryColor: '#000000',
    logo: './visuals/Brands/nxt.png',
  },
];

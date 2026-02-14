import type { BrandName } from '../../models/types';

export interface SeedChampionship {
  name: string;
  image?: string;
  brandName: BrandName;
}

export const CHAMPIONSHIPS_SEED: SeedChampionship[] = [
  { name: 'WWE Champion', image: './visuals/Championships/wwemen.png', brandName: 'RAW' },
  { name: 'WWE Women Champion', image: './visuals/Championships/wwewomen.png', brandName: 'RAW' },
  { name: 'United States Champion', image: './visuals/Championships/unitedstatesmen.png', brandName: 'RAW' },
  { name: 'United States Women Champion', image: './visuals/Championships/unitedstateswomen.png', brandName: 'RAW' },
  { name: 'WWE Tag Team Champions', image: './visuals/Championships/wwetagteam.png', brandName: 'RAW' },
  { name: 'World Heavyweight Champion', image: './visuals/Championships/worldheavyweightmen.png', brandName: 'SMACKDOWN' },
  { name: 'World Heavyweight Women Champion', image: './visuals/Championships/worldheavyweightwomen.png', brandName: 'SMACKDOWN' },
  { name: 'Intercontinental Champion', image: './visuals/Championships/intercontinentalmen.png', brandName: 'SMACKDOWN' },
  { name: 'Intercontinental Women Champion', image: './visuals/Championships/intercontinentalwomen.png', brandName: 'SMACKDOWN' },
  { name: 'World Tag Team Champions', image: './visuals/Championships/worldtagteam.png', brandName: 'SMACKDOWN' },
  { name: 'NXT Champion', image: './visuals/Championships/nxtmen.png', brandName: 'NXT' },
  { name: 'NXT Women Champion', image: './visuals/Championships/nxtwomen.png', brandName: 'NXT' },
  { name: 'NXT North American Champion', image: './visuals/Championships/northamericanmen.png', brandName: 'NXT' },
  { name: 'NXT North American Women Champion', image: './visuals/Championships/northamericanwomen.png', brandName: 'NXT' },
  { name: 'NXT Tag Team Champions', image: './visuals/Championships/nxttagteam.png', brandName: 'NXT' }
];

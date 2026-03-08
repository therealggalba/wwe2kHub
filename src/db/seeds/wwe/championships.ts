import type { BrandName } from '../../../models/types';

export interface SeedChampionship {
  name: string;
  image?: string;
  brandName: BrandName;
  gender: "Male" | "Female";
}

export const CHAMPIONSHIPS_SEED: SeedChampionship[] = [
  { name: 'WWE Champion', image: './visuals/Championships/wwemen.png', brandName: 'RAW', gender: 'Male' },
  { name: 'WWE Women Champion', image: './visuals/Championships/wwewomen.png', brandName: 'RAW', gender: 'Female' },
  { name: 'United States Champion', image: './visuals/Championships/unitedstatesmen.png', brandName: 'RAW', gender: 'Male' },
  { name: 'United States Women Champion', image: './visuals/Championships/unitedstateswomen.png', brandName: 'RAW', gender: 'Female' },
  { name: 'WWE Tag Team Champions', image: './visuals/Championships/wwetagteam.png', brandName: 'RAW', gender: 'Male' },
  { name: 'World Heavyweight Champion', image: './visuals/Championships/worldheavyweightmen.png', brandName: 'SMACKDOWN', gender: 'Male' },
  { name: 'World Heavyweight Women Champion', image: './visuals/Championships/worldheavyweightwomen.png', brandName: 'SMACKDOWN', gender: 'Female' },
  { name: 'Intercontinental Champion', image: './visuals/Championships/intercontinentalmen.png', brandName: 'SMACKDOWN', gender: 'Male' },
  { name: 'Intercontinental Women Champion', image: './visuals/Championships/intercontinentalwomen.png', brandName: 'SMACKDOWN', gender: 'Female' },
  { name: 'World Tag Team Champions', image: './visuals/Championships/worldtagteam.png', brandName: 'SMACKDOWN', gender: 'Male' },
  { name: 'NXT Champion', image: './visuals/Championships/nxtmen.png', brandName: 'NXT', gender: 'Male' },
  { name: 'NXT Women Champion', image: './visuals/Championships/nxtwomen.png', brandName: 'NXT', gender: 'Female' },
  { name: 'NXT North American Champion', image: './visuals/Championships/northamericanmen.png', brandName: 'NXT', gender: 'Male' },
  { name: 'NXT North American Women Champion', image: './visuals/Championships/northamericanwomen.png', brandName: 'NXT', gender: 'Female' },
  { name: 'NXT Tag Team Champions', image: './visuals/Championships/nxttagteam.png', brandName: 'NXT', gender: 'Male' }
];

import type { BrandName } from '../../models/types';

export interface SeedShow {
  name: string;
  brandName: BrandName | 'SHARED';
  type: 'Weekly' | 'PLE';
  image: string;
}

export const SHOWS_SEED: SeedShow[] = [
  { name: 'Monday Night RAW', brandName: 'RAW', type: 'Weekly', image: './visuals/Events/Logos/raw.png' },
  { name: 'Backlash', brandName: 'RAW', type: 'PLE', image: './visuals/Events/Logos/backlash.png' },
  { name: 'Bad Blood', brandName: 'RAW', type: 'PLE', image: './visuals/Events/Logos/badblood.png' },
  { name: 'Crown Jewel', brandName: 'RAW', type: 'PLE', image: './visuals/Events/Logos/crownjewel.png' },
  { name: 'Night Of Champions', brandName: 'RAW', type: 'PLE', image: './visuals/Events/Logos/nightofchampions.png'},
  { name: 'Payback', brandName: 'RAW', type: 'PLE', image: './visuals/Events/Logos/payback.png'},

  { name: 'Friday Night SmackDown', brandName: 'SMACKDOWN', type: 'Weekly', image: './visuals/Events/Logos/smackdown.png' },
  { name: 'Clash At The Castle', brandName: 'SMACKDOWN', type: 'PLE', image: './visuals/Events/Logos/clashatthecastle.png' },
  { name: 'Hell In A Cell', brandName: 'SMACKDOWN', type: 'PLE', image: './visuals/Events/Logos/hellinacell.png'},
  { name: "New Year's Revolution", brandName: 'SMACKDOWN', type: 'PLE', image: './visuals/Events/Logos/newyearsrevolution.png'},
  { name: 'No Mercy', brandName: 'SMACKDOWN', type: 'PLE', image: './visuals/Events/Logos/nomercy.png'},
  { name: 'Super Showdown', brandName: 'SMACKDOWN', type: 'PLE', image: './visuals/Events/Logos/supershowdown.png'},

  { name: 'Tuesday Night NXT', brandName: 'NXT', type: 'Weekly', image: './visuals/Events/Logos/nxt.png' },
  { name: 'Halloween Havoc', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/halloweenhavoc.png' },
  { name: "New Year's Evil", brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/newyearsevil.png'},
  { name: 'NXT Battleground', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/nxtbattleground.png'},
  { name: 'NXT Deadline', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/nxtdeadline.png'},
  { name: 'NXT Gold Rush', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/nxtgoldrush.png'},
  { name: 'NXT Mutiny', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/nxtmutiny.png'},
  { name: 'NXT Vengeance day', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/nxtvengeance.png'},
  { name: 'NXT No Mercy', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/nxtnomercy.png'},
  { name: 'NXT Roadblock', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/nxtroadblock.png'},
  { name: 'NXT Spring Breakin', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/nxtspringbreakin.png'},
  { name: 'NXT The Great American Bash', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/thegreatamericanbash.png'},
  { name: 'TBD', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/tbd.png'},
  { name: 'NXT Stand & Deliver 2026', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/standanddeliver2026.png'},
  { name: 'NXT Stand & Deliver 2027', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/standanddeliver2027.png'},
  { name: 'NXT Stand & Deliver 2028', brandName: 'NXT', type: 'PLE', image: './visuals/Events/Logos/standanddeliver2028.png'},

  { name: 'Hall Of Fame', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/halloffame.png' },
  { name: 'Saturday Night Main Event', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/snme.png'},
  { name: 'Main Event', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/mainevent.png'},
  { name: 'King And Queen Of The Ring', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/kingandqueenofthering.png'},
  { name: 'Money In The Bank', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/moneyinthebank.png'},
  { name: 'Elimination Chambers', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/eliminationchambers.png' },

  { name: 'Royal Rumble 2026', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/royalrumble2026.png'},
  { name: 'Royal Rumble 2027', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/royalrumble2027.png'},
  { name: 'Royal Rumble 2028', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/royalrumble2028.png'},
  { name: 'Survivor Series 2026', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/survivorseries2026.png'},
  { name: 'Survivor Series 2027', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/survivorseries2027.png'},
  { name: 'Survivor Series 2028', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/survivorseries2028.png'},
  { name: 'Summer Slam 2026', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/summerslam2026.png'},
  { name: 'Summer Slam 2027', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/summerslam2027.png'},
  { name: 'Summer Slam 2028', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/summerslam2028.png'},
  { name: 'WrestleMania 42', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/wrestlemania42.png' },
  { name: 'WrestleMania 43', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/wrestlemania43.png' },
  { name: 'WrestleMania 44', brandName: 'SHARED', type: 'PLE', image: './visuals/Events/Logos/wrestlemania44.png' },
];

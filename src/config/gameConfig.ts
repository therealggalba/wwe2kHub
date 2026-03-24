import type { BrandName } from "../models/types";

export interface BrandConfig {
  name: BrandName;
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  priority: number;
  isMajorBrand: boolean;
  isShared: boolean;
  defaultWeeklyShow: string;
}

export const GAME_CONFIG = {
  brands: [
    {
      name: "RAW",
      primaryColor: "#e00012",
      secondaryColor: "#000000",
      logo: "https://res.cloudinary.com/dgvthwz6h/image/upload/v1774380691/raw.png",
      priority: 0,
      isMajorBrand: true,
      isShared: false,
      defaultWeeklyShow: "Monday Night RAW",
    },
    {
      name: "SMACKDOWN",
      primaryColor: "#0070bb",
      secondaryColor: "#000000",
      logo: "https://res.cloudinary.com/dgvthwz6h/image/upload/v1774380691/smackdown.png",
      priority: 2,
      isMajorBrand: true,
      isShared: false,
      defaultWeeklyShow: "Friday Night SmackDown",
    },
    {
      name: "NXT",
      primaryColor: "#e7b512ff",
      secondaryColor: "#000000",
      logo: "https://res.cloudinary.com/dgvthwz6h/image/upload/v1774380691/nxt.png",
      priority: 1,
      isMajorBrand: false,
      isShared: false,
      defaultWeeklyShow: "Tuesday Night NXT",
    },
    {
      name: "SHARED",
      primaryColor: "#814ac0ff",
      secondaryColor: "#000000",
      logo: "https://res.cloudinary.com/dgvthwz6h/image/upload/v1774380691/wwe.png",
      priority: 3,
      isMajorBrand: false,
      isShared: true,
      defaultWeeklyShow: "",
    },
  ],
  settings: {
    enableMorale: true,
    enableInjuries: true,
    enableEconomy: false,
    weeksPerSeason: 52,
    injurySystem: {
      baseChance: 0.02,
      matchBonus: 0.05,
      extremeBonus: 0.10,
      minWeeks: 1,
      maxWeeks: 6,
    },
  },
};

// Types for the WWE2kHub Data Model

export type BrandName = "RAW" | "NXT" | "SMACKDOWN" | "FREE AGENT" | "SHARED";

export interface Brand {
  id?: number;
  name: BrandName;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  arena?: string;
  music?: string;
  // Relationships are handled via IDs in IndexedDB
}

export interface TitleHistoryEntry {
  wrestlerName: string;
  reignNumber: number;
  totalWeeks: number;
}

export interface Championship {
  id?: number;
  name: string;
  image?: string;
  currentChampionId?: number; // Wrestler ID
  brandId?: number; // Brand ID
  history: TitleHistoryEntry[];
}

export interface NPC {
  id?: number;
  name: string;
  image?: string;
  music?: string;
  role: string;
  brandId?: number;
}

export interface Wrestler {
  id?: number;
  name: string;
  avatar?: string;
  image?: string;
  music?: string;
  tag?: string;
  faction?: string;
  brandId?: number;
  wins: number;
  losses: number;
  draws: number;
  currentTitlesIds: number[]; // Championship IDs
  historicalTitlesIds: number[]; // Championship IDs
  injuryStatus: string; // "None", "Minor", "Major", etc.
  moral: number; // 0-100
  contract: string; // e.g., "Full-time", "Part-time", "Expired"
  rating: number;
  gender: "Male" | "Female";
  alignment: "Face" | "Heel" | "Tweener";
}

export interface Match {
  id?: string; // Client-side temp ID
  titleMatch: boolean;
  championshipId?: number;
  type: string; // "Singles", "Tag Team", "Hell in a Cell", etc.
  participantsIds: number[];
  winnersIds: number[];
  rating: number; // 0-5 stars
  notes?: string;
}

export interface Promo {
  id: string;
  participantsIds: number[];
  description: string;
  rating?: number;
}

export interface Video {
  id: string;
  description: string;
}

export interface Segment {
  id: string;
  type: "Match" | "Promo" | "Video";
  matchData?: Match;
  promoData?: Promo;
  videoData?: Video;
}

export interface MatchCard {
  segments: Segment[];
}

export interface Show {
  id?: number;
  name: string;
  date: Date;
  brandId?: number;
  music?: string;
  image?: string;
  card?: MatchCard;
  valuation: number; // Overall show rating
  type: "Weekly" | "PLE" | "Special";
}

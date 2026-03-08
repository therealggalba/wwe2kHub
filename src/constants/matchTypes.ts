export const MATCH_QUANTITIES = [
  "1 vs 1",
  "Triple Threat",
  "Fatal 4 Way",
  "Elimination X",
  "2 vs 2",
  "2 vs 2 vs 2",
  "3 vs 3",
  "5 vs 5",
  "Battle Royal",
  "Casino Gauntlet",
  "Royal Rumble"
];

export const STIPULATIONS_BY_QUANTITY: Record<string, string[]> = {
  "1 vs 1": [
    "Singles", "Submission", "Hell In A Cell", "Steel Cage", "Ladder", 
    "Falls Count Anywhere", "Extreme Rules", "Street Fight", 
    "First Blood", "Last Man Standing", "Death", "Best Of 3"
  ],
  "Triple Threat": ["Standard", "Extreme Rules", "Ladder"],
  "Fatal 4 Way": ["Standard", "Extreme Rules", "Ladder"],
  "Elimination X": ["Elimination"],
  "2 vs 2": ["Tag Team", "Tag Team Extreme Rules", "Tag Team Ladder"],
  "2 vs 2 vs 2": ["Triple Threat Tag", "Triple Threat Tag Extreme Rules", "Triple Threat Tag Ladder"],
  "3 vs 3": ["Trios", "Trios Extreme Rules", "Trios Ladder", "Trios Elimination"],
  "5 vs 5": ["Survivor Series", "Anarchy In The Arena", "WarGames", "Blood And Guts"],
  "Battle Royal": ["10 - Battle Royal"],
  "Casino Gauntlet": ["Gauntlet"],
  "Royal Rumble": ["Royal Rumble"]
};

export const getParticipantCount = (quantity: string): number => {
  if (quantity === "1 vs 1") return 2;
  if (quantity.includes("Triple Threat")) return 3;
  if (quantity.includes("Fatal 4 Way")) return 4;
  if (quantity === "2 vs 2") return 4;
  if (quantity === "2 vs 2 vs 2") return 6;
  if (quantity === "3 vs 3") return 6;
  if (quantity === "5 vs 5") return 10;
  if (quantity.includes("Elimination X")) return 6; 
  if (quantity.includes("Battle Royal")) return 10;
  if (quantity.includes("Casino Gauntlet")) return 21;
  if (quantity.includes("Royal Rumble")) return 30;
  return 2;
};

export type DuelMode = "online" | "offline";

export type DuelOpponent = {
  available: boolean;
  description: string;
  difficulty: string;
  fightHref: string;
  id: string;
  mode: DuelMode;
  name: string;
  type: string;
};

export const DUEL_OPPONENTS: DuelOpponent[] = [
  {
    available: true,
    description: "Un mannequin maudit revenu à la vie pour éprouver les bases du combat.",
    difficulty: "Initiation",
    fightHref: "/game/duel/scarecrow",
    id: "epouvantail-ressuscite",
    mode: "offline",
    name: "Épouvantail Ressuscité",
    type: "Boss d'entraînement",
  },
];

export function getDuelOpponent(duelId: string): DuelOpponent | undefined {
  return DUEL_OPPONENTS.find((opponent) => opponent.id === duelId);
}

export function getDuelFightHref(duelId: string): string | null {
  return getDuelOpponent(duelId)?.fightHref ?? null;
}

export interface TeamMeta {
  id: string;
  bannerName: string;
  shortLabel: string;
  emblem: string;
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Thematic identities for the game's teams. The raw team ids (T1/T2/T3) come
 * from the room reducer; this module layers Musketeers-flavored branding on
 * top so the UI can show bold, recognizable team colors throughout.
 */
export const TEAM_META: Record<string, TeamMeta> = {
  T1: {
    id: 'T1',
    bannerName: 'Musketeers',
    shortLabel: 'M',
    emblem: 'fleur',
    primary: '#1b2a5b',
    secondary: '#8bb0ff',
    accent: '#e0b957',
  },
  T2: {
    id: 'T2',
    bannerName: 'Cardinals',
    shortLabel: 'C',
    emblem: 'cross',
    primary: '#5a1825',
    secondary: '#ffb0a0',
    accent: '#e0b957',
  },
  T3: {
    id: 'T3',
    bannerName: 'Royal Guard',
    shortLabel: 'R',
    emblem: 'crown',
    primary: '#7a5d1e',
    secondary: '#ffe39a',
    accent: '#1b2a5b',
  },
};

export function teamMetaFor(teamId: string): TeamMeta {
  return TEAM_META[teamId] ?? {
    id: teamId,
    bannerName: `Team ${teamId}`,
    shortLabel: teamId.slice(-1) || '?',
    emblem: 'fleur',
    primary: '#1b2a5b',
    secondary: '#8bb0ff',
    accent: '#e0b957',
  };
}

import type { SessionUser } from '@queries/auth.queries';

export const STORY_VIEWS = ['sg', 'member'] as const;
export type StoryView = (typeof STORY_VIEWS)[number];

export const STORY_USERS = {
  member: {
    canManageTechnicalAccounts: false,
    civility: 'Monsieur PETIT',
    displayedRole: { group: 'MEMBER', id: 'MEMBRE_SIEGE', label: 'Membre du siège' },
    email: 'jean.petit@justice.fr',
    firstName: 'Jean',
    formation: 'SIEGE',
    id: 'member-1',
    isAdmin: false,
    isImpersonated: false,
    lastName: 'Petit',
    passwordChange: 'ALLOWED',
    role: 'MEMBRE_DU_SIEGE',
  },
  sg: {
    canManageTechnicalAccounts: false,
    civility: 'Madame BERNARD',
    displayedRole: { group: 'SECRETARIAT', id: 'SECRETARY', label: 'Secrétaire générale adjointe' },
    email: 'sophie.bernard@justice.fr',
    firstName: 'Sophie',
    formation: null,
    id: 'sg-1',
    isAdmin: false,
    isImpersonated: false,
    lastName: 'Bernard',
    passwordChange: 'ALLOWED',
    role: 'ADJOINT_SECRETAIRE_GENERAL',
  },
} satisfies Record<StoryView, SessionUser>;

// who added a file, saved a number or validated a document, as the API names them
export const STORY_AUTHORS = {
  member: { id: STORY_USERS.member.id, name: 'Jean PETIT' },
  sg: { id: STORY_USERS.sg.id, name: 'Sophie BERNARD' },
} satisfies Record<StoryView, { id: string; name: string }>;

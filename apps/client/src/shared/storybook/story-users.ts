import type { SessionUser } from '@queries/auth.queries';

export const STORY_VIEWS = ['sg', 'member'] as const;
export type StoryView = (typeof STORY_VIEWS)[number];

export const STORY_USERS = {
  member: {
    civility: 'Monsieur PETIT',
    email: 'jean.petit@justice.fr',
    firstName: 'Jean',
    formation: 'SIEGE',
    id: 'member-1',
    isAdmin: false,
    isImpersonated: false,
    lastName: 'Petit',
    role: 'MEMBRE_DU_SIEGE',
  },
  sg: {
    civility: 'Madame BERNARD',
    email: 'sophie.bernard@justice.fr',
    firstName: 'Sophie',
    formation: null,
    id: 'sg-1',
    isAdmin: false,
    isImpersonated: false,
    lastName: 'Bernard',
    role: 'ADJOINT_SECRETAIRE_GENERAL',
  },
} satisfies Record<StoryView, SessionUser>;

// who added a file, saved a number or validated a document, as the API names them
export const STORY_AUTHORS = {
  member: { id: STORY_USERS.member.id, name: 'Jean PETIT' },
  sg: { id: STORY_USERS.sg.id, name: 'Sophie BERNARD' },
} satisfies Record<StoryView, { id: string; name: string }>;

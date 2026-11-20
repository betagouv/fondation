export type Impersonation = { impersonatorId: string };

export const PERSONAL_CONTENT_VISIBILITIES = ['PRIVATE', 'VISIBLE'] as const;
export type PersonalContentVisibility = (typeof PERSONAL_CONTENT_VISIBILITIES)[number];

/** what a person writes for themselves or what is shared with them by name: the admin impersonating them neither reads nor changes it */
export function personalContentVisibility(user: {
  impersonation: Impersonation | undefined;
}): PersonalContentVisibility {
  return user.impersonation ? 'PRIVATE' : 'VISIBLE';
}

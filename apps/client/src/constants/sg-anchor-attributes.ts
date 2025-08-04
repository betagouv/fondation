export const SECRETARIAT_GENERAL_ANCHOR_ATTRIBUTES = {
  dashboard: '/secretariat-general',
  nouvelleTransparence: '/secretariat-general/nouvelle-transparence',
  transparence: (id: string) => `/secretariat-general/transparence/session/${id}`
} as const;

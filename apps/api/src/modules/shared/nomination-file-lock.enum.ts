export const NominationFileLockEnum = {
  ARCHIVED_SESSION: 'ARCHIVED_SESSION',
  REPORTED: 'REPORTED',
} as const;
export type NominationFileLockEnum = (typeof NominationFileLockEnum)[keyof typeof NominationFileLockEnum];

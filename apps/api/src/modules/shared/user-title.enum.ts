export const USER_TITLES = [
  'PRESIDENT_SIEGE',
  'PRESIDENT_PARQUET',
  'DEPUTY_PRESIDENT_SIEGE',
  'DEPUTY_PRESIDENT_PARQUET',
  'FIRST_SECRETARY',
] as const;
export type UserTitleEnum = (typeof USER_TITLES)[number];

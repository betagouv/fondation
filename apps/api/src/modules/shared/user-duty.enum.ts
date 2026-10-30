export const USER_DUTIES = ['PRESIDENT', 'DEPUTY_PRESIDENT', 'SECRETARY', 'OFFICER'] as const;
export type UserDutyEnum = (typeof USER_DUTIES)[number];

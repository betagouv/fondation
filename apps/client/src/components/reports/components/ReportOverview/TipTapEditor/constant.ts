export const headingLevels = [1 as const, 2 as const, 3 as const];
export type HeadingLevel = (typeof headingLevels)[number];

export const headingLevels = [1, 2, 3] as const;
export type HeadingLevel = (typeof headingLevels)[number];

export const dataFileIdKey = 'data-file-id';
export const dataFileNameKey = 'data-file-name';

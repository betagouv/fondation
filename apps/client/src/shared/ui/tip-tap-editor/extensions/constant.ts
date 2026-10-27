export const headingLevels = [1, 2, 3] as const;
export type HeadingLevel = (typeof headingLevels)[number];

/** 'text' is the editor of the summaries and comments, 'page' adds what a help page needs */
export const EDITOR_FEATURES = ['page', 'text'] as const;
export type EditorFeatures = (typeof EDITOR_FEATURES)[number];

export const dataFileIdKey = 'data-file-id';
export const dataFileNameKey = 'data-file-name';

/** the identity a title keeps through its renames, written by the UniqueID extension */
export const headingIdKey = 'data-id';

export function isSectionAnchor(href: string): boolean {
  return /^#[\w-]+$/.test(href);
}

/** the links the API keeps: a web address, a mail address or a section of the page */
export function isAllowedLink(href: string): boolean {
  return isSectionAnchor(href) || /^(https?:\/\/|mailto:)/i.test(href);
}

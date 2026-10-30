export const headingLevels = [1, 2, 3] as const;
export type HeadingLevel = (typeof headingLevels)[number];

/** 'text' is the editor of the summaries and comments, 'page' adds what a help page needs */
export const EDITOR_FEATURES = ['page', 'text'] as const;
export type EditorFeatures = (typeof EDITOR_FEATURES)[number];

export const dataFileIdKey = 'data-file-id';
export const dataFileNameKey = 'data-file-name';

export const IMAGE_MIME_TYPES = ['image/gif', 'image/heic', 'image/jpeg', 'image/png', 'image/webp'] as const;
/** the formats a browser plays on its own: nothing converts a video on the server */
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const;

export function isVideo(file: { type: string }): boolean {
  return (VIDEO_MIME_TYPES as readonly string[]).includes(file.type);
}

export const headingIdKey = 'data-id';

export function isSectionAnchor(href: string): boolean {
  return /^#[\w-]+$/.test(href);
}

/** the links the API keeps: a web address, a mail address or a section of the page */
export function isAllowedLink(href: string): boolean {
  return isSectionAnchor(href) || /^(https?:\/\/|mailto:)/i.test(href);
}

// an admin never answers: the browser remembers which previews were opened, nothing is sent
const PREVIEW_SEEN_KEY = 'session-feedback-preview-seen';

export function isPreviewSeen(sessionId: string): boolean {
  try {
    return localStorage.getItem(`${PREVIEW_SEEN_KEY}:${sessionId}`) !== null;
  } catch {
    return false;
  }
}

export function markPreviewSeen(sessionId: string): void {
  try {
    localStorage.setItem(`${PREVIEW_SEEN_KEY}:${sessionId}`, '1');
  } catch {
    // the dot simply stays until the next visit
  }
}

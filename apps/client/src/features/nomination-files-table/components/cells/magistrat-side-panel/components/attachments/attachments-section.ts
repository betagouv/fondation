const REVEAL_ATTEMPTS = 60;

export function attachmentsSectionId(nominationFileId: string): string {
  return `magistrat-attachments-${nominationFileId}`;
}

export function revealAttachments(nominationFileId: string, attempts = REVEAL_ATTEMPTS): void {
  const section = document.getElementById(attachmentsSectionId(nominationFileId));
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (attempts > 0) requestAnimationFrame(() => revealAttachments(nominationFileId, attempts - 1));
}

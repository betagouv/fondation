/** converts a list of requirements into a sorted list */
export function dag<
  File extends {
    file: { id: string };
    requirements: { requiredFileId: string }[];
  },
>(files: readonly File[]): File[] {
  return files.toSorted((a, b) => {
    if (a.requirements.length === 0 && b.requirements.length === 0) return 0;
    if (a.requirements.length === 0 && b.requirements.length > 0) return -1;
    if (b.requirements.length === 0 && a.requirements.length > 0) return 1;

    if (
      b.requirements.some(({ requiredFileId }) => requiredFileId === a.file.id)
    ) {
      return -1;
    }

    if (
      a.requirements.some(({ requiredFileId }) => requiredFileId === b.file.id)
    ) {
      return 1;
    }

    return 0;
  });
}

const LOLFI_FILES = [
  'CANDIDATS.xml',
  'DESIDERATA.xml',
  'FONCTIONS.xml',
  'GRADES.xml',
  'JURIDICTIONS.xml',
  'MAGISTRATS.xml',
  'POSADS.xml',
  'POSTES_2.xml',
  'SESSIONS.xml',
  'TRANSPARENCES.xml',
  'TYPE_JURIDICTION.xml',
] as const;

type LolfiFile = (typeof LOLFI_FILES)[number];

/**
 * TODO: this list is not complete yet
 */
const REQUIREMENTS = new Map<LolfiFile, Set<LolfiFile>>([
  ['GRADES.xml', new Set([] as const satisfies LolfiFile[])],

  ['FONCTIONS.xml', new Set([] as const satisfies LolfiFile[])],

  ['POSADS.xml', new Set([] as const satisfies LolfiFile[])],

  ['TYPE_JURIDICTION.xml', new Set([] as const satisfies LolfiFile[])],

  [
    'JURIDICTIONS.xml',
    new Set(['TYPE_JURIDICTION.xml'] as const satisfies LolfiFile[]),
  ],

  [
    'POSTES_2.xml',
    new Set([
      'JURIDICTIONS.xml',
      'GRADES.xml',
      'POSADS.xml',
      'FONCTIONS.xml',
    ] as const satisfies LolfiFile[]),
  ],

  ['SESSIONS.xml', new Set([] as const satisfies LolfiFile[])],

  [
    'MAGISTRATS.xml',
    new Set(['POSTES_2.xml', 'POSADS.xml'] as const satisfies LolfiFile[]),
  ],

  ['TRANSPARENCES.xml', new Set([] as const satisfies LolfiFile[])],

  ['CANDIDATS.xml', new Set([] as const satisfies LolfiFile[])],

  ['DESIDERATA.xml', new Set([] as const satisfies LolfiFile[])],
]);

const LOLFI_FILE_SET = new Set(LOLFI_FILES);
function isLolfiFile(value: string): value is LolfiFile {
  return LOLFI_FILE_SET.has(value as any);
}

export function withLolfiFileRequirements<
  T extends { id: string; name: string },
>(files: readonly T[]): (T & { requirements: { requiredFileId: string }[] })[] {
  const fileIdPerName = new Map(files.map((f) => [f.name, f.id]));

  return files.map((file) => {
    const fileName = file.name;
    if (!isLolfiFile(fileName)) return { ...file, requirements: [] };

    const requirements = Array.from(REQUIREMENTS.get(fileName) ?? []).flatMap(
      (x) => {
        const fileId = fileIdPerName.get(x);
        return fileId ? [{ requiredFileId: fileId }] : [];
      },
    );

    return { ...file, requirements };
  });
}

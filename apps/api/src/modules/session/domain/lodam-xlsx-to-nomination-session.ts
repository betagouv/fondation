import { setTimeout } from 'node:timers/promises';
import * as xlsx from 'node-xlsx';

import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { Logger } from '@nestjs/common';

const logger = new Logger('lodamXlsxToNominationSession');
export async function lodamXlsxToNominationSession(input: {
  file: Buffer;
}): Promise<
  | { success: false; errors: LineResultFailure['error'][] }
  | { success: true; files: NominationFileToImport[] }
> {
  const [result] = xlsx.parse<RawLodamLine>(input.file, {
    raw: false,
    range: 3,
    dateNF: 'dd/mm/yyyy',
    header: RAW_LODAM_HEADERS as unknown as string[],
  });

  const lineResults: LineResult[] = [];
  let parsedLinesCount = 0;

  for await (const linesChunk of toAsyncChunkedData({
    input: (result ?? { data: [] }).data,
  })) {
    const chunkLineResults = linesChunk.map((line, index) => {
      const lineNumber = parsedLinesCount + index;
      try {
        return parseLodamXlsxLine(line, lineNumber);
      } catch (e) {
        logger.warn(`failed parsing LODAM line ${lineNumber}: ${e}`);
        return {
          success: false,
          error: { lineNumber, messages: [`Ligne mal formatée`] },
        } satisfies LineResultFailure;
      }
    });

    lineResults.push(...chunkLineResults);
    parsedLinesCount += linesChunk.length;
  }

  const parseFailed = lineResults.some(({ success }) => !success);
  if (parseFailed) {
    return {
      success: false,
      errors: lineResults
        .filter((result): result is LineResultFailure => !result.success)
        .map((result) => result.error),
    };
  }

  return {
    success: true,
    files: lineResults.map((result: LineResultSuccess) => result.value),
  };
}

/** @internal exported for tests */
export function parseLodamXlsxLine(
  line: RawLodamLine,
  lineNumber: number,
): LineResult {
  const folderNumber = Number(line.folderNumber);
  if (!Number.isFinite(folderNumber) || folderNumber <= 0) {
    return {
      success: false,
      error: {
        lineNumber,
        messages: [
          `Le numéro de proposition est inexploitable: "${line.folderNumber}"`,
        ],
      },
    } satisfies LineResultFailure;
  }

  const errors: string[] = [];
  const output = new Map<
    FieldName | 'rank',
    number | string[] | string | DateOnly | null
  >([['folderNumber', folderNumber]]);

  const [name, rank] = (line.name ?? '').split('\n').map((x) => x.trim());

  if (!name) {
    errors.push(`Magistrat est vide`);
  } else {
    output.set('name', name);
  }

  output.set('rank', rank || null);

  output.set(
    'reporters',
    (line.reporters ?? '')
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean),
  );

  output.set(
    'observers',
    (line.observers ?? '')
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean),
  );

  for (const field of [
    'birthDate',
    'lastRankingDate',
    'lastPositionDate',
  ] as const) {
    try {
      output.set(field, toDateOnly(line[field] ?? ''));
    } catch {
      const fieldNames = {
        birthDate: 'La date de naissance',
        lastRankingDate: 'La date de passage au grade',
        lastPositionDate: 'La date de prise de fonction',
      };
      errors.push(`${fieldNames[field]} est inexploitable: "${line[field]}"`);
    }
  }

  output.set('biography', (line.biography ?? '').trim());
  output.set('currentPosition', (line.currentPosition ?? '').trim());

  const targetedPosition = (line.targetedPosition ?? '').trim();
  if (targetedPosition.length === 0) {
    errors.push(`Le poste cible est vide`);
  } else {
    output.set('targetedPosition', targetedPosition);
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: { folderNumber, messages: errors },
    } satisfies LineResultFailure;
  }

  const value = Object.fromEntries(
    ([...RAW_LODAM_HEADERS, 'rank'] as const)
      .filter((field): field is FieldName | 'rank' => !field.startsWith('_'))
      .map((field) => [field, output.get(field)] as const),
  ) as unknown as LineResultSuccess['value'];

  return { success: true, value } satisfies LineResultSuccess;
}

/**
 * this method tries to decrease the pressure on the event loop while parsing a large number
 * of data by chunking said data, and waiting for some time between yields.
 */
async function* toAsyncChunkedData<T>(options: {
  input: readonly T[];
  timeout?: number;
  chunkSize?: number;
}): AsyncIterable<T[]> {
  const { input, timeout = 10, chunkSize = 100 } = options;
  let index = 0;

  while (index < input.length) {
    yield input.slice(index, index + chunkSize);

    index += chunkSize;
    await setTimeout(timeout);
  }
}

/** @throws */
function toDateOnly(value: string | undefined | null): DateOnly | null {
  const trimmed = (value ?? '').replace(/\\n/g, '').trim();

  if (trimmed.length === 0) return null;
  return DateOnly.fromString(trimmed, 'dd/MM/yyyy', 'fr');
}

const RAW_LODAM_HEADERS = [
  'folderNumber',
  'name',
  'targetedPosition',
  'birthDate',
  'currentPosition',
  'lastPositionDate',
  'lastRankingDate',
  '_eqav',
  'observers',
  'reporters',
  '_career',
  'biography',
] as const;

type LodamHeader = (typeof RAW_LODAM_HEADERS)[number];
type FieldName = Exclude<LodamHeader, `_${string}`>;
type RawLodamLine = Record<FieldName, string | undefined>;

type NominationFileToImport = {
  folderNumber: number;
  name: string;
  rank: string | null;
  targetedPosition: string;
  birthDate: DateOnly | null;
  currentPosition: string;
  lastPositionDate: DateOnly | null;
  observers: string[];
  reporters: string[];
  biography: string;
};

type LineResultSuccess = {
  success: true;
  value: NominationFileToImport;
};

type LineResultFailure = {
  success: false;
  error:
    | { lineNumber: number; messages: string[] }
    | { folderNumber: number; messages: string[] };
};

type LineResult = LineResultSuccess | LineResultFailure;

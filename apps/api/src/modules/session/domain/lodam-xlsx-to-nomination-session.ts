import { Logger } from '@nestjs/common';
import * as xlsx from 'node-xlsx';
import { setTimeout } from 'node:timers/promises';

import { Magistrat } from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { NominationFile } from './nomination-file';

const logger = new Logger('lodamXlsxToNominationSession');
export function lodamXlsxToNominationFiles(input: {
  file: Buffer;
}): Promise<
  | { success: false; errors: LineResultFailure['error'][] }
  | { success: true; files: NominationFile[] }
> {
  const [result] = xlsx.parse<RawLodamLine>(input.file, {
    raw: false,
    range: 3,
    dateNF: 'dd/mm/yyyy',
    header: RAW_LODAM_HEADERS as unknown as string[],
  });

  const lines = result?.data ?? [];
  return lodamToNominationFiles(lines);
}

/** @internal */
export async function lodamToNominationFiles(
  rawLines: readonly RawLodamLine[],
): Promise<
  | { success: false; errors: LineResultFailure['error'][] }
  | { success: true; files: NominationFile[] }
> {
  const lineResults: LineResult[] = [];
  let parsedLinesCount = 0;
  const fileNumbers = new Map<number, number>();

  for await (const linesChunk of toAsyncChunkedData({
    input: rawLines,
  })) {
    const chunkLineResults = linesChunk.map((line, index) => {
      const lineNumber = parsedLinesCount + index + 1;
      try {
        return parseLodamXlsxLine(line, lineNumber, fileNumbers);
      } catch (e) {
        logger.warn(`failed parsing LODAM line ${lineNumber}: ${e}`);
        return {
          success: false,
          error: { lineNumber, messages: [`Ligne mal formée`] },
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
  fileNumbers: Map<number, number>,
): LineResult {
  const fileNumber = Number(line.fileNumber);
  if (!Number.isFinite(fileNumber) || fileNumber <= 0) {
    return {
      success: false,
      error: {
        lineNumber,
        messages: [
          `Le numéro de proposition est inexploitable: "${line.fileNumber}"`,
        ],
      },
    } satisfies LineResultFailure;
  }

  const errors: string[] = [];
  const output = new Map<
    FieldName | 'rank' | 'grade',
    number | string[] | string | DateOnly | null
  >([['fileNumber', fileNumber]]);

  if (fileNumbers.has(fileNumber)) {
    errors.push(
      `l.${lineNumber} un dossier n°${fileNumber} est déjà défini l.${fileNumbers.get(fileNumber)!}`,
    );
  } else {
    fileNumbers.set(fileNumber, lineNumber);
  }

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
      .filter((x) => x !== EMPTY_PLACEHOLDERS.reporters && !!x),
  );

  output.set(
    'observers',
    (line.observers ?? '')
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean),
  );

  for (const [field, dateI18n] of [
    ['birthDate', 'La date de naissance'],
    ['lastRankingDate', 'La date de passage au grade'],
    ['lastPositionDate', 'La date de prise de fonction'],
  ] as const) {
    try {
      output.set(field, toDateOnly(line[field]));
    } catch {
      errors.push(`${dateI18n} est inexploitable: "${line[field]}"`);
    }
  }

  output.set('biography', (line.biography ?? '').trim() || null);
  output.set('currentPosition', (line.currentPosition ?? '').trim() || null);
  output.set(
    'careerInformation',
    (line.careerInformation ?? '').trim() || null,
  );

  const targetedPositionAndGrade = (line.targetedPosition ?? '').trim();
  if (targetedPositionAndGrade.length === 0) {
    errors.push(`Le poste cible est vide`);
  } else {
    const splitted = targetedPositionAndGrade.split(/\s+-\s+/);

    const maybeGrade = splitted.at(-1)?.trim() ?? '';
    const isGrade = Object.values(Magistrat.Grade).includes(maybeGrade as any);
    if (!isGrade) {
      errors.push(`Grade inconnu: "${maybeGrade}"`);
    } else {
      output.set('grade', maybeGrade);
    }

    output.set('targetedPosition', splitted.slice(0, -1).join(' - '));
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: { fileNumber: fileNumber, messages: errors },
    } satisfies LineResultFailure;
  }

  const value = Object.fromEntries(
    ([...RAW_LODAM_HEADERS, 'rank', 'grade'] as const)
      .filter(
        (field): field is FieldName | 'rank' | 'grade' =>
          !field.startsWith('_'),
      )
      .map((field) => [field, output.get(field)] as const),
  ) as unknown as LineResultSuccess['value'];

  return { success: true, value } satisfies LineResultSuccess;
}

const RAW_LODAM_HEADERS = [
  'fileNumber',
  'name',
  'targetedPosition',
  'birthDate',
  'currentPosition',
  'lastPositionDate',
  'lastRankingDate',
  '_eqav',
  'observers',
  'reporters',
  'careerInformation',
  'biography',
] as const;

const EMPTY_PLACEHOLDERS = {
  date: 'NON DEFINI',
  reporters: 'SANS AFFECTATION',
} as const;

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

  if (trimmed.length === 0 || trimmed === EMPTY_PLACEHOLDERS.date) return null;
  return DateOnly.fromString(trimmed, 'dd/MM/yyyy', 'fr');
}

type LodamHeader = (typeof RAW_LODAM_HEADERS)[number];
type FieldName = Exclude<LodamHeader, `_${string}`>;
export type RawLodamLine = Record<FieldName, string | undefined>;

type LineResultSuccess = {
  success: true;
  value: NominationFile;
};

type LineResultFailure = {
  success: false;
  error:
    | { lineNumber: number; messages: string[] }
    | { fileNumber: number; messages: string[] };
};

type LineResult = LineResultSuccess | LineResultFailure;

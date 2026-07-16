import { setTimeout } from 'node:timers/promises';
import { inspect } from 'node:util';

import { Logger } from '@nestjs/common';
import * as xlsx from 'node-xlsx';

import { GradeEnum } from 'src/modules/shared/grade.enum';
import { DateOnly } from 'src/utils/date-only';

import { LodamNominationFile } from './nomination-file';

const logger = new Logger('lodamXlsxToNominationSession');
export function lodamXlsxToNominationFiles(input: {
  form?: { date: DateOnly };
  file: Buffer;
}): Promise<
  { success: false; errors: LineResultFailure['error'][] } | { success: true; files: LodamNominationFile[] }
> {
  const [result] = xlsx.parse<RawLodamLine>(input.file, {
    raw: false,
    range: 3,
    dateNF: 'dd/mm/yyyy',
    header: RAW_LODAM_HEADERS as unknown as string[],
  });

  const lines = result?.data ?? [];
  return lodamToNominationFiles(lines, input.form?.date.toDate() ?? new Date());
}

/** @internal */
export async function lodamToNominationFiles(
  rawLines: readonly RawLodamLine[],
  date: Date,
): Promise<
  { success: false; errors: LineResultFailure['error'][] } | { success: true; files: LodamNominationFile[] }
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
        return parseLodamXlsxLine(date, line, lineNumber, fileNumbers);
      } catch (e) {
        logger.warn(`failed parsing LODAM line ${lineNumber}: ${inspect(e)}`);
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
  date: Date,
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
        messages: [`Le numéro de proposition est inexploitable: "${line.fileNumber}"`],
      },
    } satisfies LineResultFailure;
  }

  const errors: string[] = [];
  const output = new Map<
    FieldName | 'rank' | 'grade' | 'targetedGrade',
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
  output.set('careerInformation', (line.careerInformation ?? '').trim() || null);

  const targetedPositionAndGrade = (line.targetedPosition ?? '').trim();
  if (targetedPositionAndGrade.length === 0) {
    errors.push(`Le poste cible est vide`);
  }

  const splitted = targetedPositionAndGrade.split(/\s+-\s+/);
  const targetedGrade = splitted.at(-1)?.trim() ?? '';
  const isGrade = Object.values(GradeEnum).includes(targetedGrade as any);
  if (!isGrade) {
    errors.push(`Grade inconnu: "${targetedGrade}"`);
  }

  output.set('targetedPosition', splitted.slice(0, -1).join(' - '));
  output.set('targetedGrade', targetedGrade);

  let grade: string | undefined = undefined;
  if (line._eqav === 'E') {
    grade = targetedGrade;
  }

  if (!grade) {
    /** on 01/12/2025 the grading system changed G1 -> G2 -> G3 -> G3sup */
    if (date.getTime() >= Date.UTC(2025, 11, 1)) {
      grade = (() => {
        switch (targetedGrade) {
          case 'G3sup':
            return 'G3';
          case 'G3':
            return 'G2';
          case 'G2':
            return 'G1';
          case 'G1':
          default:
            return 'G1';
        }
      })();
    } else {
      // It was II -> I -> HH in the past
      grade = (() => {
        switch (targetedGrade) {
          case 'HH':
            return 'I';
          case 'I':
          case 'II':
          default:
            return 'II';
        }
      })();
    }
  }

  output.set('grade', grade);

  if (errors.length > 0) {
    return {
      success: false,
      error: { fileNumber: fileNumber, messages: errors },
    } satisfies LineResultFailure;
  }

  const value = Object.fromEntries(
    ([...RAW_LODAM_HEADERS, 'rank', 'grade', 'targetedGrade'] as const)
      .filter((field): field is FieldName | 'rank' | 'grade' | 'targetedGrade' => !field.startsWith('_'))
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
export type RawLodamLine = Record<LodamHeader, string | undefined>;

type LineResultSuccess = {
  success: true;
  value: LodamNominationFile;
};

type LineResultFailure = {
  success: false;
  error: { lineNumber: number; messages: string[] } | { fileNumber: number; messages: string[] };
};

type LineResult = LineResultSuccess | LineResultFailure;

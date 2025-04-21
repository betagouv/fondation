import { diff } from 'json-diff';
import _ from 'lodash';
import { z } from 'zod';
import {
  NominationFilesImportedEvent,
  NominationFilesImportedEventPayload,
} from './events/nomination-file-imported.event';
import {
  NominationFileModel,
  NominationFileModelSnapshot,
} from './nomination-file';
import {
  NominationFileRead,
  nominationFileReadContentSchema,
  nominationFileReadListSchema,
} from './nomination-file-read';
import { NominationFile } from 'shared-models';
import { ManagementRule } from './rules';

export class NominationFilesContentReadCollection {
  private readonly _nominationFileReadList: NominationFileRead[];

  constructor(nominationFileReadList: NominationFileRead[]) {
    this._nominationFileReadList = nominationFileReadListSchema.parse(
      nominationFileReadList,
    );
  }

  toModelsWithEvent(
    generatedUuid: () => string,
    currentDate: Date,
  ): [NominationFileModel[], NominationFilesImportedEvent | null] {
    if (this._nominationFileReadList.length === 0) {
      return [[], null];
    }

    const nominationFiles = this._nominationFileReadList.map(
      (content) =>
        new NominationFileModel(generatedUuid(), currentDate, content),
    );

    const payload: NominationFilesImportedEventPayload = nominationFiles.map(
      (nominationFile) => {
        const { id, content } = nominationFile.toSnapshot();
        return {
          nominationFileImportedId: id,
          content,
        };
      },
    );

    const nominationFilesImportedEvent = new NominationFilesImportedEvent(
      generatedUuid(),
      payload,
      currentDate,
    );

    return [nominationFiles, nominationFilesImportedEvent];
  }

  perTransparence() {
    const aggregatedLists = _.groupBy(
      this._nominationFileReadList,
      (nominationFile) => nominationFile.content.transparency,
    );
    return Object.entries(aggregatedLists).map(
      ([transparence, nominationFiles]) => {
        const nominationFilesContentReadCollection =
          new NominationFilesContentReadCollection(nominationFiles);
        return {
          transparency: transparence,
          readCollection: nominationFilesContentReadCollection,
        };
      },
    );
  }

  newNominationFiles(existingNominationFiles: NominationFileModelSnapshot[]) {
    const adiff = diff(
      Object.fromEntries(
        existingNominationFiles.map((f) => [f.rowNumber, f.content]),
      ),
      Object.fromEntries(
        this._nominationFileReadList.map((f) => [f.rowNumber, f.content]),
      ),
      { keysOnly: true },
    );
    if (!adiff) return new NominationFilesContentReadCollection([]);

    const newNominationFiles = Object.entries(adiff)
      .filter((item) => item[0].endsWith('__added'))
      .map((item) => {
        const rowNumber = item[0].replace('__added', '');
        const content = item[1];
        return {
          rowNumber: parseInt(rowNumber),
          content: nominationFileReadContentSchema.parse(content),
        };
      });
    return new NominationFilesContentReadCollection(newNominationFiles);
  }

  updatedNominationFiles(
    existingNominationFiles: NominationFileModelSnapshot[],
  ): UpdatedNominationFilesFields[] {
    const adiff = diff(
      Object.fromEntries(
        existingNominationFiles.map((f) => [
          f.rowNumber,
          {
            folderNumber: f.content.folderNumber,
            observers: f.content.observers,
            rules: f.content.rules,
          },
        ]),
      ),
      Object.fromEntries(
        this._nominationFileReadList.map((f) => [
          f.rowNumber,
          {
            folderNumber: f.content.folderNumber,
            observers: f.content.observers,
            rules: f.content.rules,
          },
        ]),
      ),
      {
        outputNewOnly: true,
        sort: true,
      },
    );
    if (!adiff) return [];

    const newNominationFiles = Object.entries(adiff).map((item) => {
      const rowNumber = item[0];
      const content = item[1] as Record<string, unknown>;
      const readNominationFile = this._nominationFileReadList.find(
        (f) => f.rowNumber === Number(rowNumber),
      );
      if (!readNominationFile) throw new Error('nomination file not found');

      return updatedNominationFilesFieldsSchema.parse({
        rowNumber: Number(rowNumber),
        content: {
          ...content,
          ...('observers' in content && {
            // 'outputNewOnly' fonctionne uniquement sur les objets, pas les listes
            observers: readNominationFile.content.observers,
          }),
          ...('rules' in content && {
            ...readNominationFile.content.rules,
            [NominationFile.RuleGroup.MANAGEMENT]: {
              ...readNominationFile.content.rules[
                NominationFile.RuleGroup.MANAGEMENT
              ],
              [ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT]:
                readNominationFile.content.rules[
                  NominationFile.RuleGroup.MANAGEMENT
                ][ManagementRule.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT] ||
                readNominationFile.content.rules[
                  NominationFile.RuleGroup.MANAGEMENT
                ][ManagementRule.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE],
            },
          }),
        },
      });
    });

    return newNominationFiles;
  }
}

const updatedNominationFilesFieldsSchema = z.object({
  rowNumber: z.number(),
  content: nominationFileReadContentSchema
    .pick({
      folderNumber: true,
      observers: true,
    })
    .partial()
    .extend({
      rules: z.any(),
    }),
});

export type UpdatedNominationFilesFields = z.infer<
  typeof updatedNominationFilesFieldsSchema
>;

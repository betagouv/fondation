// oxlint-disable typescript/unbound-method
import { NotFoundException } from '@nestjs/common';
import { mock, type MockProxy } from 'vitest-mock-extended';

import { OfficialReportNominationFileDelegate } from '../../../../../generated/prisma/models';
import { transactionalTest } from '../../../../framework/database/transactional-test';
import { Files } from '../../../../framework/files';
import { DocsNominationFilesFinder } from '../../../shared/infrastructure/finders/docs-nomination-files.finder';
import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';
import { OfficialReportRepository } from '../repositories/official-report.repository';

import { InvalidateOfficialReportUseCase } from './invalidate-official-report.use-case';

describe('InvalidateOfficialReportUseCase', () => {
  let repository: MockProxy<OfficialReportRepository>;
  let run: <T>(handle: () => Promise<T>) => Promise<T>;
  let useCase: InvalidateOfficialReportUseCase;

  const invalidateTheReport = () =>
    run(() =>
      useCase.handle({
        type: 'NominationFilesOutcomeUpdated',
        payload: { files: [{ comment: null, nominationFileId: 'file-id', outcome: 'VALIDATED' }] },
      }),
    );

  beforeEach(async () => {
    const officialReportNominationFile = mock<OfficialReportNominationFileDelegate>();
    officialReportNominationFile.findMany.mockResolvedValue([
      { nominationFileId: 'file-id', version: { officialReportId: 'report-id' } },
    ] as never);

    const { db, inContext } = await transactionalTest({
      $queryRawTyped: vi.fn(),
      officialReportNominationFile,
    });
    run = inContext;

    repository = mock<OfficialReportRepository>();
    useCase = new InvalidateOfficialReportUseCase(
      db,
      mock<DocsNominationFilesFinder>(),
      mock<Files>(),
      repository,
      mock<OfficialReportVersionFinder>(),
    );
  });

  it('should skip an official report deleted meanwhile', async () => {
    repository.find.mockRejectedValue(new NotFoundException());

    await invalidateTheReport();

    expect(repository.persist).not.toHaveBeenCalled();
  });

  it('should surface any other error loading the official report', async () => {
    const error = new Error('connection lost');
    repository.find.mockRejectedValue(error);

    await expect(invalidateTheReport()).rejects.toBe(error);
  });
});

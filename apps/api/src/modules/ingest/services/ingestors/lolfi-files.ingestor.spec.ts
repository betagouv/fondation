import * as Sentry from '@sentry/node';
import { mock } from 'vitest-mock-extended';

import type { ApiConfig } from '../../../framework/config';
import type { Db } from '../../../framework/database';
import type { VeilleDesPostesInternalService } from '../../../veille-des-postes/veille-des-postes-internal.service';

import { LolfiFilesIngestor } from './lolfi-files.ingestor';

vi.mock('@sentry/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/node')>()),
  captureException: vi.fn(),
}));

/** the cleanup is private: an import reaches it only through a whole run */
function deleteLapsedPositionVacanciesOf(veilleDesPostes: VeilleDesPostesInternalService): Promise<void> {
  const db = mock<Db>();
  // withTransaction has overloads: the ingestor uses the one with the callback only
  db.withTransaction.mockImplementation(((run: () => Promise<unknown>) => run()) as never);
  const ingestor = new LolfiFilesIngestor(
    mock(),
    db,
    mock(),
    mock<ApiConfig>({ frontendOriginUrl: '' }),
    mock(),
    mock(),
    mock(),
    mock(),
    mock(),
    mock(),
    mock(),
    mock(),
    mock(),
    mock(),
    mock(),
    mock(),
    mock(),
    mock(),
    veilleDesPostes,
  );
  return (
    ingestor as unknown as { deleteLapsedPositionVacancies: () => Promise<void> }
  ).deleteLapsedPositionVacancies();
}

describe('LolfiFilesIngestor', () => {
  beforeEach(() => vi.mocked(Sentry.captureException).mockClear());

  it('reports a failed cleanup of the lapsed vacancies, without failing the import', async () => {
    const error = new Error('the database went away');
    const veilleDesPostes = mock<VeilleDesPostesInternalService>();
    veilleDesPostes.internalDeleteLapsedPositionVacancies.mockRejectedValue(error);

    await expect(deleteLapsedPositionVacanciesOf(veilleDesPostes)).resolves.toBeUndefined();

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});

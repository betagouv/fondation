import * as Sentry from '@sentry/node';
import { mock } from 'vitest-mock-extended';

import type { ApiConfig } from '../../../framework/config';
import type { PositionVacancyRepository } from '../../../veille-des-postes/infrastructure/repositories/position-vacancy.repository';

import { LolfiFilesIngestor } from './lolfi-files.ingestor';

vi.mock('@sentry/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/node')>()),
  captureException: vi.fn(),
}));

/** the cleanup runs at the end of an import, which reaches it only through the whole run */
function deleteLapsedPositionVacanciesOf(positionVacancies: PositionVacancyRepository): Promise<void> {
  const ingestor = new LolfiFilesIngestor(
    mock(),
    mock(),
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
    positionVacancies,
  );
  return (
    ingestor as unknown as { deleteLapsedPositionVacancies: () => Promise<void> }
  ).deleteLapsedPositionVacancies();
}

describe('LolfiFilesIngestor', () => {
  beforeEach(() => vi.mocked(Sentry.captureException).mockClear());

  it('reports a failed cleanup of the lapsed vacancies, without failing the import', async () => {
    const error = new Error('the database went away');
    const positionVacancies = mock<PositionVacancyRepository>();
    positionVacancies.deleteLapsed.mockRejectedValue(error);

    await expect(deleteLapsedPositionVacanciesOf(positionVacancies)).resolves.toBeUndefined();

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});

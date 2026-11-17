// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import {
  JusticePresentationPlanDelegate,
  JusticePresentationPlanRemovedAgendaDelegate,
  JusticePresentationPlanToAgendaDelegate,
} from '../../../../../generated/prisma/models';
import { Clock } from '../../../../framework/clock';
import { transactionalTest } from '../../../../framework/database/transactional-test';
import { Files } from '../../../../framework/files';
import { FindPresentationPlanDocumentPdfQuery } from '../queries/find-presentation-plan-document-pdf.query';
import { JusticePresentationPlanRepository } from '../repositories/justice-presentation-plan.repository';

import { ValidatePresentationPlanUseCase } from './validate-presentation-plan.use-case';

describe('ValidatePresentationPlanUseCase', () => {
  let prisma: {
    $queryRawTyped: ReturnType<typeof vi.fn>;
    $transaction: (fn: (client: object) => Promise<unknown>) => Promise<unknown>;
    justicePresentationPlan: MockProxy<JusticePresentationPlanDelegate>;
    justicePresentationPlanRemovedAgenda: MockProxy<JusticePresentationPlanRemovedAgendaDelegate>;
    justicePresentationPlanToAgenda: MockProxy<JusticePresentationPlanToAgendaDelegate>;
  };
  let files: MockProxy<Files>;
  let run: <T>(handle: () => Promise<T>) => Promise<T>;
  let useCase: ValidatePresentationPlanUseCase;

  const rendered = { id: 'rendered-id', path: ['docs', 'rendered-id.pdf'] };
  const stored = { agendas: [{ agendaId: 'agenda-id' }], html: '<p>Notice</p>' };

  beforeEach(async () => {
    prisma = {
      $queryRawTyped: vi.fn(),
      $transaction: (fn) => fn(prisma),
      justicePresentationPlan: mock(),
      justicePresentationPlanRemovedAgenda: mock(),
      justicePresentationPlanToAgenda: mock(),
    };

    const { db, inContext } = await transactionalTest(prisma);
    run = inContext;

    const pdfQuery = mock<FindPresentationPlanDocumentPdfQuery>();
    pdfQuery.render.mockResolvedValue({ html: stored.html, pdf: rendered });

    files = mock<Files>();
    useCase = new ValidatePresentationPlanUseCase(
      new Clock(),
      db,
      files,
      pdfQuery,
      mock<JusticePresentationPlanRepository>(),
    );

    prisma.justicePresentationPlan.findUnique.mockResolvedValueOnce({
      agendas: stored.agendas,
      pdfId: null,
    } as never);
    prisma.justicePresentationPlanToAgenda.findMany.mockResolvedValue([]);
  });

  it('should attach the rendered PDF to the notice it validates', async () => {
    prisma.justicePresentationPlan.findUnique.mockResolvedValueOnce({ ...stored, pdfId: null } as never);

    await run(() => useCase.handle({ id: 'plan-id', validatorId: 'validator-id' }));

    expect(prisma.justicePresentationPlan.update).toHaveBeenCalledOnce();
    expect(files.delete).not.toHaveBeenCalled();
  });

  it('should delete the rendered PDF when another validation took the notice meanwhile', async () => {
    prisma.justicePresentationPlan.findUnique.mockResolvedValueOnce({
      ...stored,
      pdfId: 'other-id',
    } as never);

    await run(() => useCase.handle({ id: 'plan-id', validatorId: 'validator-id' }));

    expect(prisma.justicePresentationPlan.update).not.toHaveBeenCalled();
    expect(files.delete).toHaveBeenCalledExactlyOnceWith([rendered]);
  });
});

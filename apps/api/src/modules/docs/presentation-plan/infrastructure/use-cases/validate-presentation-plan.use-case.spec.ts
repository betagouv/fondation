// oxlint-disable typescript/unbound-method
import { ClsPluginTransactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { Test } from '@nestjs/testing';
import { ClsModule, ClsService } from 'nestjs-cls';
import { mock, type MockProxy } from 'vitest-mock-extended';

import {
  JusticePresentationPlanDelegate,
  JusticePresentationPlanRemovedAgendaDelegate,
  JusticePresentationPlanToAgendaDelegate,
} from '../../../../../generated/prisma/models';
import { Clock } from '../../../../framework/clock';
import { Db } from '../../../../framework/database';
import { Files } from '../../../../framework/files';
import { FindPresentationPlanDocumentPdfQuery } from '../queries/find-presentation-plan-document-pdf.query';
import { JusticePresentationPlanRepository } from '../repositories/justice-presentation-plan.repository';

import { ValidatePresentationPlanUseCase } from './validate-presentation-plan.use-case';

const PRISMA = Symbol('prisma');

describe('ValidatePresentationPlanUseCase', () => {
  let prisma: {
    $queryRawTyped: ReturnType<typeof vi.fn>;
    $transaction: (fn: (client: object) => Promise<unknown>) => Promise<unknown>;
    justicePresentationPlan: MockProxy<JusticePresentationPlanDelegate>;
    justicePresentationPlanRemovedAgenda: MockProxy<JusticePresentationPlanRemovedAgendaDelegate>;
    justicePresentationPlanToAgenda: MockProxy<JusticePresentationPlanToAgendaDelegate>;
  };
  let cls: ClsService;
  let files: MockProxy<Files>;
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

    const moduleRef = await Test.createTestingModule({
      imports: [
        ClsModule.forRoot({
          global: true,
          plugins: [
            new ClsPluginTransactional({
              adapter: new TransactionalAdapterPrisma({ prismaInjectionToken: PRISMA }),
              imports: [
                {
                  exports: [PRISMA],
                  module: class PrismaModule {},
                  providers: [{ provide: PRISMA, useValue: prisma }],
                },
              ],
            }),
          ],
        }),
      ],
    }).compile();
    cls = moduleRef.get(ClsService);

    const pdfQuery = mock<FindPresentationPlanDocumentPdfQuery>();
    pdfQuery.render.mockResolvedValue({ html: stored.html, pdf: rendered });

    files = mock<Files>();
    useCase = new ValidatePresentationPlanUseCase(
      new Clock(),
      moduleRef.get(TransactionHost) as Db,
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

    await cls.run(() => useCase.handle({ id: 'plan-id', validatorId: 'validator-id' }));

    expect(prisma.justicePresentationPlan.update).toHaveBeenCalledOnce();
    expect(files.delete).not.toHaveBeenCalled();
  });

  it('should delete the rendered PDF when another validation took the notice meanwhile', async () => {
    prisma.justicePresentationPlan.findUnique.mockResolvedValueOnce({
      ...stored,
      pdfId: 'other-id',
    } as never);

    await cls.run(() => useCase.handle({ id: 'plan-id', validatorId: 'validator-id' }));

    expect(prisma.justicePresentationPlan.update).not.toHaveBeenCalled();
    expect(files.delete).toHaveBeenCalledExactlyOnceWith([rendered]);
  });
});

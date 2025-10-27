import { pgEnum } from 'drizzle-orm/pg-core';
import { Magistrat, Transparency } from 'shared-models';

import * as schema from 'src/modules/framework/drizzle/schemas';
import { DomainEventStatus } from 'src/shared-kernel/business-logic/models/domain-event';
import { assertNever } from 'src/utils/assert-never';

export const domainEventStatusEnum = schema.domainEventStatusEnum;
export const formationEnum = schema.formationEnum;

export const transparencyEnum = pgEnum(
  'transparency',
  Object.values(Transparency) as [Transparency, ...Transparency[]],
);

type DrizzleDomainEventStatusEnum =
  (typeof schema.domainEventStatusEnum)['enumValues'][number];
export function toDomainEventStatus(
  value: DrizzleDomainEventStatusEnum,
): DomainEventStatus {
  switch (value) {
    case 'NEW':
      return DomainEventStatus.NEW;
    case 'PENDING':
      return DomainEventStatus.PENDING;
    case 'CONSUMED':
      return DomainEventStatus.CONSUMED;
    default:
      return assertNever(value);
  }
}

type DrizzleFormationEnum = (typeof schema.formationEnum)['enumValues'][number];
export function toFormation(value: DrizzleFormationEnum): Magistrat.Formation {
  switch (value) {
    case 'PARQUET':
      return Magistrat.Formation.PARQUET;
    case 'SIEGE':
      return Magistrat.Formation.SIEGE;
    default:
      return assertNever(value);
  }
}

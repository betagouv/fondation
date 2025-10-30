import { Magistrat, Transparency } from 'shared-models';

import * as schema from 'src/modules/framework/drizzle/schemas';
import { DomainEventStatus } from 'src/shared-kernel/business-logic/models/domain-event';
import { assertNever } from 'src/utils/assert-never';

export const domainEventStatusEnum = schema.domainEventStatusEnum;
export const formationEnum = schema.formationEnum;

export const transparencyEnum = schema.transparencyEnum;

type DrizzleTransparencyEnum =
  (typeof schema.transparencyEnum)['enumValues'][number];
export function toTransparency(value: DrizzleTransparencyEnum): Transparency {
  switch (value) {
    case 'AUTOMNE_2024':
      return Transparency.AUTOMNE_2024;
    case 'PROCUREURS_GENERAUX_8_NOVEMBRE_2024':
      return Transparency.PROCUREURS_GENERAUX_8_NOVEMBRE_2024;
    case 'PROCUREURS_GENERAUX_25_NOVEMBRE_2024':
      return Transparency.PROCUREURS_GENERAUX_25_NOVEMBRE_2024;
    case 'TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024':
      return Transparency.TABLEAU_GENERAL_T_DU_25_NOVEMBRE_2024;
    case 'CABINET_DU_MINISTRE_DU_21_JANVIER_2025':
      return Transparency.CABINET_DU_MINISTRE_DU_21_JANVIER_2025;
    case 'SIEGE_DU_06_FEVRIER_2025':
      return Transparency.SIEGE_DU_06_FEVRIER_2025;
    case 'PARQUET_DU_06_FEVRIER_2025':
      return Transparency.PARQUET_DU_06_FEVRIER_2025;
    case 'PARQUET_DU_20_FEVRIER_2025':
      return Transparency.PARQUET_DU_20_FEVRIER_2025;
    case 'DU_03_MARS_2025':
      return Transparency.DU_03_MARS_2025;
    case 'GRANDE_TRANSPA_DU_21_MARS_2025':
      return Transparency.GRANDE_TRANSPA_DU_21_MARS_2025;
    case 'DU_30_AVRIL_2025':
      return Transparency.DU_30_AVRIL_2025;
    case 'MARCH_2026':
      return Transparency.MARCH_2026;
    default:
      return assertNever(value);
  }
}

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

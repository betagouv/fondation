import { Magistrat, type DateOnlyJson } from 'shared-models';
import { formationToLabel } from '../components/reports/labels/labels-mappers';
import type { ReportListItem } from '../react-query/queries/list-reports.queries';
import { DateTransparenceRoutesMapper } from './date-transparence-routes.utils';
import { getGdsDetailsPath } from './route-path.utils';

interface TransparencyItem {
  label: string;
  href: string;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

interface GdsFormationVM {
  formationLabel: string;
  transparencies: TransparencyItem[] | null;
}

interface GdsTransparenciesVM {
  noGdsTransparencies: boolean;
  formationsCount: 0 | 1 | 2;
  [Magistrat.Formation.PARQUET]: GdsFormationVM;
  [Magistrat.Formation.SIEGE]: GdsFormationVM;
}

interface TransparenciesVM {
  noTransparencies: boolean;
  'GARDE DES SCEAUX': GdsTransparenciesVM;
}

// Fonction pour formater le label de transparence avec la date
const transparencyToLabel = (transparency: string, dateTransparence: DateOnlyJson): string => {
  const formattedDate = `${dateTransparence.day.toString().padStart(2, '0')}/${dateTransparence.month.toString().padStart(2, '0')}/${dateTransparence.year}`;
  DateTransparenceRoutesMapper.toPathSegment(dateTransparence);
  return `T ${formattedDate} (${transparency})`;
};

// Fonction pour calculer la différence de temps entre deux dates
const timeDiff = (
  date1: { day: number; month: number; year: number },
  date2: { day: number; month: number; year: number }
): number => {
  const date1Obj = new Date(date1.year, date1.month - 1, date1.day);
  const date2Obj = new Date(date2.year, date2.month - 1, date2.day);
  return date1Obj.getTime() - date2Obj.getTime();
};

const formatGdsTransparencies = (reports: ReportListItem[]): Record<string, TransparencyItem[]> => {
  const sortedReports = [...reports].sort((a, b) => timeDiff(b.dateTransparence, a.dateTransparence));

  const gdsTransparencies: Record<string, TransparencyItem[]> = {
    [Magistrat.Formation.PARQUET]: [],
    [Magistrat.Formation.SIEGE]: []
  };

  sortedReports.forEach((report) => {
    const transparencyLabel = transparencyToLabel(report.transparency, report.dateTransparence);

    const path = getGdsDetailsPath(
      report.dateTransparence,
      report.transparency,
      report.formation as Magistrat.Formation
    );

    const transparencyItem: TransparencyItem = {
      label: transparencyLabel,
      href: path,
      onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        window.location.href = path;
      }
    };

    // Déduplication : on ne garde qu'une occurrence par label de transparence
    const formation = report.formation as Magistrat.Formation;

    switch (formation) {
      case Magistrat.Formation.PARQUET:
        if (
          gdsTransparencies[Magistrat.Formation.PARQUET].findIndex(
            ({ label }) => label === transparencyLabel
          ) === -1
        ) {
          gdsTransparencies[Magistrat.Formation.PARQUET].push(transparencyItem);
        }
        break;
      case Magistrat.Formation.SIEGE:
        if (
          gdsTransparencies[Magistrat.Formation.SIEGE].findIndex(
            ({ label }) => label === transparencyLabel
          ) === -1
        ) {
          gdsTransparencies[Magistrat.Formation.SIEGE].push(transparencyItem);
        }
        break;
      default: {
        const _exhaustiveCheck: never = formation;
        throw new Error(`Unknown formation: ${_exhaustiveCheck}`);
      }
    }
  });

  return gdsTransparencies;
};

const toNullableTransparencyGroup = (transparencies: TransparencyItem[]): TransparencyItem[] | null => {
  return transparencies?.length ? transparencies : null;
};

export const formatTransparencies = (data: ReportListItem[] | undefined): TransparenciesVM => {
  if (!data) {
    return {
      noTransparencies: true,
      'GARDE DES SCEAUX': {
        noGdsTransparencies: true,
        formationsCount: 0,
        [Magistrat.Formation.PARQUET]: {
          formationLabel: formationToLabel(Magistrat.Formation.PARQUET),
          transparencies: null
        },
        [Magistrat.Formation.SIEGE]: {
          formationLabel: formationToLabel(Magistrat.Formation.SIEGE),
          transparencies: null
        }
      }
    };
  }

  const gdsTransparencies = formatGdsTransparencies(data);

  const noParquetGdsTransparency =
    !gdsTransparencies[Magistrat.Formation.PARQUET] ||
    gdsTransparencies[Magistrat.Formation.PARQUET].length === 0;
  const noSiegeGdsTransparency =
    !gdsTransparencies[Magistrat.Formation.SIEGE] ||
    gdsTransparencies[Magistrat.Formation.SIEGE].length === 0;

  const noGdsTransparencies = !gdsTransparencies || (noParquetGdsTransparency && noSiegeGdsTransparency);

  const formationsCount = ((gdsTransparencies[Magistrat.Formation.PARQUET] ? 1 : 0) +
    (gdsTransparencies[Magistrat.Formation.SIEGE] ? 1 : 0)) as 0 | 1 | 2;

  return {
    noTransparencies: noGdsTransparencies,
    'GARDE DES SCEAUX': {
      noGdsTransparencies,
      formationsCount,
      [Magistrat.Formation.PARQUET]: {
        formationLabel: formationToLabel(Magistrat.Formation.PARQUET),
        transparencies: toNullableTransparencyGroup(gdsTransparencies[Magistrat.Formation.PARQUET])
      },
      [Magistrat.Formation.SIEGE]: {
        formationLabel: formationToLabel(Magistrat.Formation.SIEGE),
        transparencies: toNullableTransparencyGroup(gdsTransparencies[Magistrat.Formation.SIEGE])
      }
    }
  };
};

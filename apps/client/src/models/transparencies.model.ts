import type { Magistrat } from 'shared-models';
import type { TransparencyLabel } from '../components/reports/labels/labels-mappers';

export type GdsFormationVM = {
  formationLabel: string;
  transparencies:
    | {
        label: TransparencyLabel;
        href: string;
        onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
      }[]
    | null;
};

export type ReportTransparenciesVM = {
  noTransparencies: boolean;
  'GARDE DES SCEAUX': {
    noGdsTransparencies: boolean;
    formationsCount: 0 | 1 | 2;
    [Magistrat.Formation.PARQUET]: GdsFormationVM;
    [Magistrat.Formation.SIEGE]: GdsFormationVM;
  };
};

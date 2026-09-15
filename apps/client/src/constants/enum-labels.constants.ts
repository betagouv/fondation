import { defineMessages } from 'react-intl';

import type {
  FormationEnum,
  JobStatusEnum,
  ObservationFollowupEnum,
  PrioriteEnum,
  ReportStatusEnum,
  RoleEnum,
} from '@/types/enums.types';

export const FormationEnumMessages = defineMessages({
  PARQUET: { defaultMessage: 'parquet' },
  SIEGE: { defaultMessage: 'siège' },
} satisfies Record<FormationEnum, { defaultMessage: string }>);

export const JobStatusEnumMessages = defineMessages({
  CANCELED: { defaultMessage: 'annulé' },
  FAILED: { defaultMessage: 'échec' },
  IDLE: { defaultMessage: 'en attente' },
  RUNNING: { defaultMessage: 'en cours' },
  SUCCEEDED: { defaultMessage: 'succès' },
} satisfies Record<JobStatusEnum, { defaultMessage: string }>);

export const ObservationFollowUpEnumMessages = defineMessages({
  ALERT: { defaultMessage: 'Signalement' },
  INTERESTING: { defaultMessage: `Digne d'intérêt` },
  REFERENCE: { defaultMessage: 'Recommandation' },
} satisfies Record<ObservationFollowupEnum, { defaultMessage: string }>);

export const PrioriteEnumMessages = defineMessages({
  ETOILE: { defaultMessage: 'Étoilé' },
  OUTRE_MER: { defaultMessage: 'Outre-mer' },
  PROFILE: { defaultMessage: 'Profilé' },
} satisfies Record<PrioriteEnum, { defaultMessage: string }>);

export const ReportStatusEnumMessages = defineMessages({
  IN_PROGRESS: { defaultMessage: 'En cours' },
  NEW: { defaultMessage: 'Nouveau' },
  READY_TO_SUPPORT: { defaultMessage: 'Prêt à soutenir' },
  SUPPORTED: { defaultMessage: 'Soutenu' },
} satisfies Record<ReportStatusEnum, { defaultMessage: string }>);

export const RoleEnumMessages = defineMessages({
  ADJOINT_SECRETAIRE_GENERAL: { defaultMessage: 'Secrétariat général' },
  ADMIN: { defaultMessage: 'Administrateur' },
  MEMBRE_COMMUN: { defaultMessage: 'Membre commun' },
  MEMBRE_DU_PARQUET: { defaultMessage: 'Membre du parquet' },
  MEMBRE_DU_SIEGE: { defaultMessage: 'Membre du siège' },
} satisfies Record<RoleEnum, { defaultMessage: string }>);

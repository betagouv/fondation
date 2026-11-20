import type { AlertDeadline, PositionAlert, PositionStatus } from '@queries/veille-des-postes.queries';

export const KNOWN_STATUSES: Record<PositionStatus, true> = {
  MAY_BECOME_VACANT: true,
  OCCUPIED: true,
  VACANT: true,
};

export const KNOWN_ALERTS: Record<PositionAlert, true> = {
  PROPOSED_IN_SESSION: true,
  RETIREMENT: true,
  SEVEN_YEARS_ON_POSITION: true,
};

export const KNOWN_DEADLINES: Record<AlertDeadline, true> = {
  WITHIN_SIX_MONTHS: true,
  WITHIN_TWELVE_MONTHS: true,
};

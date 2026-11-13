import { addMonths, format } from 'date-fns';

import { DateOnly } from '../../../utils/date-only';

import type { CourtOfCassationPosition } from './court-of-cassation-position';

export const POSITION_ALERTS = ['RETIREMENT', 'SEVEN_YEARS_ON_POSITION', 'PROPOSED_IN_SESSION'] as const;
export type PositionAlert = (typeof POSITION_ALERTS)[number];

export const ALERT_DEADLINES = ['WITHIN_SIX_MONTHS', 'WITHIN_TWELVE_MONTHS'] as const;
export type AlertDeadline = (typeof ALERT_DEADLINES)[number];

const ALERT_LABELS: Record<PositionAlert, string> = {
  PROPOSED_IN_SESSION: 'Magistrat proposé sur une session en cours',
  RETIREMENT: 'Départ en retraite prévisionnel',
  SEVEN_YEARS_ON_POSITION: 'Mouvement obligatoire après 7 ans',
};
const DEADLINE_LABELS: Record<AlertDeadline, string> = {
  WITHIN_SIX_MONTHS: '6 prochains mois',
  WITHIN_TWELVE_MONTHS: '12 prochains mois',
};

/** art. 76 of the ordonnance n° 58-1270: 68 for the first president of the Cour de cassation only */
const RETIREMENT_AGE = 67;
const COURT_OF_CASSATION_FIRST_PRESIDENT_RETIREMENT_AGE = 68;
const RETIREMENT_NOTICE_MONTHS = 12;
const YEARS_BEFORE_A_MOVE = 7;
const MOVE_NOTICE_MONTHS = 6;

export type WatchedPosition =
  | 'COURT_OF_APPEAL_FIRST_PRESIDENT'
  | 'JUDICIAL_COURT_PRESIDENT'
  | CourtOfCassationPosition;
export type AlertRules = { movesAfterSevenYears: boolean; retirementAge: number };

/** only the presidents of a court of appeal or of a judicial court must move after seven years */
export function alertRulesOf(position: WatchedPosition): AlertRules {
  if (position === 'COURT_OF_APPEAL_FIRST_PRESIDENT' || position === 'JUDICIAL_COURT_PRESIDENT') {
    return { movesAfterSevenYears: true, retirementAge: RETIREMENT_AGE };
  }
  return {
    movesAfterSevenYears: false,
    retirementAge:
      position === 'FIRST_PRESIDENT' ? COURT_OF_CASSATION_FIRST_PRESIDENT_RETIREMENT_AGE : RETIREMENT_AGE,
  };
}

export type HolderProposal = { sessionDate: DateOnly; sessionName: string; targetedPosition: string | null };
export type HolderFacts = {
  birthDate: DateOnly | null;
  installationDate: DateOnly | null;
  proposal: HolderProposal | null;
};

/** the label is the sentence of the specification, the short label fits in a table cell */
export type HolderAlert = {
  /** null beyond twelve months, which only a proposal for a far session can reach */
  deadline: AlertDeadline | null;
  dueDate: DateOnly;
  id: PositionAlert;
  label: string;
  shortLabel: string;
};

/** the most urgent first: the sort by alert reads the first one */
export function alertsOf(holder: HolderFacts, rules: AlertRules, today: DateOnly): HolderAlert[] {
  const alerts: Omit<HolderAlert, 'deadline'>[] = [];

  if (holder.birthDate) {
    const dueDate = plusMonths(holder.birthDate, rules.retirementAge * 12);
    if (!isAfter(plusMonths(dueDate, -RETIREMENT_NOTICE_MONTHS), today)) {
      alerts.push({
        dueDate,
        id: 'RETIREMENT',
        ...(isAfter(dueDate, today)
          ? {
              label: `Départ en retraite prévisionnel à ${rules.retirementAge} ans à partir du ${frenchDate(dueDate)}`,
              shortLabel: `Retraite le ${frenchDate(dueDate)}`,
            }
          : {
              label: `Âge limite de départ en retraite de ${rules.retirementAge} ans atteint le ${frenchDate(dueDate)}`,
              shortLabel: `Âge limite atteint le ${frenchDate(dueDate)}`,
            }),
      });
    }
  }
  if (rules.movesAfterSevenYears && holder.installationDate) {
    const dueDate = plusMonths(holder.installationDate, YEARS_BEFORE_A_MOVE * 12);
    if (!isAfter(plusMonths(dueDate, -MOVE_NOTICE_MONTHS), today)) {
      alerts.push({
        dueDate,
        id: 'SEVEN_YEARS_ON_POSITION',
        ...(isAfter(dueDate, today)
          ? {
              label: `En poste depuis plus de 7 ans à partir du ${frenchDate(dueDate)}`,
              shortLabel: `7 ans en poste le ${frenchDate(dueDate)}`,
            }
          : {
              label: `7 ans en poste atteints le ${frenchDate(dueDate)}`,
              shortLabel: `7 ans en poste atteints le ${frenchDate(dueDate)}`,
            }),
      });
    }
  }
  if (holder.proposal) {
    const { sessionDate, sessionName, targetedPosition } = holder.proposal;
    const session = `la session "${sessionName}" du ${frenchDate(sessionDate)}`;
    alerts.push({
      dueDate: sessionDate,
      id: 'PROPOSED_IN_SESSION',
      label: targetedPosition
        ? `Proposé sur le poste "${targetedPosition}" de ${session}`
        : `Proposé sur un poste de ${session}`,
      shortLabel: `Proposé en session du ${frenchDate(sessionDate)}`,
    });
  }

  return alerts
    .map((alert) => ({ ...alert, deadline: deadlineOf(alert.dueDate, today) }))
    .toSorted((a, b) => a.dueDate.toDate().getTime() - b.dueDate.toDate().getTime());
}

/** the deadlines a holder answers: an alert within six months is within twelve months too */
export function deadlinesOf(alerts: readonly HolderAlert[]): AlertDeadline[] {
  if (alerts.some(({ deadline }) => deadline === 'WITHIN_SIX_MONTHS')) return [...ALERT_DEADLINES];
  return alerts.some(({ deadline }) => deadline === 'WITHIN_TWELVE_MONTHS') ? ['WITHIN_TWELVE_MONTHS'] : [];
}

function deadlineOf(dueDate: DateOnly, today: DateOnly): AlertDeadline | null {
  if (!isAfter(dueDate, plusMonths(today, 6))) return 'WITHIN_SIX_MONTHS';
  return isAfter(dueDate, plusMonths(today, 12)) ? null : 'WITHIN_TWELVE_MONTHS';
}

export function positionAlerts(): { id: PositionAlert; label: string }[] {
  return POSITION_ALERTS.map((id) => ({ id, label: ALERT_LABELS[id] }));
}

export function alertDeadlines(): { id: AlertDeadline; label: string }[] {
  return ALERT_DEADLINES.map((id) => ({ id, label: DEADLINE_LABELS[id] }));
}

function plusMonths(date: DateOnly, months: number): DateOnly {
  const moved = addMonths(date.toLocalStartOfDay(), months);
  return new DateOnly(moved.getFullYear(), moved.getMonth() + 1, moved.getDate());
}

function isAfter(date: DateOnly, other: DateOnly): boolean {
  return date.toDate().getTime() > other.toDate().getTime();
}

function frenchDate(date: DateOnly): string {
  return format(date.toLocalStartOfDay(), 'dd/MM/yyyy');
}

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import type { ExcludedJurisdictionConflict } from '../context/member-excluded-jurisdictions';

import { ExcludedJurisdictionNotice } from './ExcludedJurisdictionNotice';

const LYON = "Cour d'appel de Lyon";
const NANTES = "Cour d'appel de Nantes";
const RENNES = "Cour d'appel de Rennes";

function conflict(memberName: string, jurisdiction: string): ExcludedJurisdictionConflict {
  return { fileId: 'file', fileNumber: 12, jurisdiction, memberId: memberName, memberName };
}

function renderNotice(conflicts: ExcludedJurisdictionConflict[]) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <ExcludedJurisdictionNotice conflicts={conflicts} />
    </IntlProvider>,
  );
}

describe('ExcludedJurisdictionNotice', () => {
  it('keeps the live region in the DOM when there is no conflict', () => {
    renderNotice([]);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('gathers the reporters sharing the same excluded jurisdiction on a single line', () => {
    renderNotice([conflict('Camille COMMUN', LYON), conflict('Sophie SIÈGE', LYON)]);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(
      screen.getByText(`Juridiction exclue pour Camille COMMUN et Sophie SIÈGE : ${LYON}`),
    ).toBeInTheDocument();
  });

  it('keeps one line per jurisdiction when they differ', () => {
    renderNotice([conflict('Camille COMMUN', LYON), conflict('Sophie SIÈGE', RENNES)]);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(`Juridiction exclue pour Camille COMMUN : ${LYON}`)).toBeInTheDocument();
    expect(screen.getByText(`Juridiction exclue pour Sophie SIÈGE : ${RENNES}`)).toBeInTheDocument();
  });

  it('lists every jurisdiction excluded for the same reporter, in the plural', () => {
    renderNotice([conflict('Camille COMMUN', LYON), conflict('Camille COMMUN', RENNES)]);

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(
      screen.getByText(`Juridictions exclues pour Camille COMMUN : ${LYON} et ${RENNES}`),
    ).toBeInTheDocument();
  });

  it('sorts the jurisdictions alphabetically, whatever the order they arrive in', () => {
    renderNotice([conflict('Camille COMMUN', RENNES), conflict('Camille COMMUN', LYON)]);

    expect(
      screen.getByText(`Juridictions exclues pour Camille COMMUN : ${LYON} et ${RENNES}`),
    ).toBeInTheDocument();
  });

  it('enumerates three jurisdictions with a final conjunction', () => {
    renderNotice([
      conflict('Camille COMMUN', LYON),
      conflict('Camille COMMUN', RENNES),
      conflict('Camille COMMUN', NANTES),
    ]);

    expect(
      screen.getByText(`Juridictions exclues pour Camille COMMUN : ${LYON}, ${NANTES} et ${RENNES}`),
    ).toBeInTheDocument();
  });
});

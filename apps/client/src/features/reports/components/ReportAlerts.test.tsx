import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { frFormat } from '@/i18n/formats';
import type { DetailedReportDto } from '@api/types';

import { ReportAlerts } from './ReportAlerts';

function renderAlerts(report: Partial<DetailedReportDto>) {
  return render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <ReportAlerts
        report={{
          auditionDate: null,
          auditionExpected: false,
          auditionTime: null,
          canScheduleAudition: true,
          missingEvaluation: false,
          ...report,
        }}
      />
    </IntlProvider>,
  );
}

describe('ReportAlerts', () => {
  it('shows no alert when nothing is expected nor missing', () => {
    renderAlerts({});

    expect(screen.queryByText('Une audition est à prévoir pour ce poste')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Évaluation manquante dans le dossier administratif LOLFI'),
    ).not.toBeInTheDocument();
  });

  it('announces an audition to schedule on an audition position', () => {
    renderAlerts({ auditionExpected: true });

    expect(screen.getByText('Une audition est à prévoir pour ce poste')).toBeInTheDocument();
  });

  it('hides the audition to schedule once the file no longer accepts one', () => {
    renderAlerts({ auditionExpected: true, canScheduleAudition: false });

    expect(screen.queryByText('Une audition est à prévoir pour ce poste')).not.toBeInTheDocument();
  });

  it('announces the scheduled audition rather than the one to schedule', () => {
    renderAlerts({
      auditionDate: { year: 2029, month: 6, day: 15 },
      auditionExpected: true,
      auditionTime: { hours: 14, minutes: 30, seconds: 0 },
    });

    expect(screen.getByText('Une audition est prévue le 15/06/2029 à 14:30')).toBeInTheDocument();
  });

  it('announces a missing evaluation', () => {
    renderAlerts({ missingEvaluation: true });

    expect(screen.getByText('Évaluation manquante dans le dossier administratif LOLFI')).toBeInTheDocument();
  });
});

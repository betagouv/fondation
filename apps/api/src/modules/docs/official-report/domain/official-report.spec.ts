import { makeId } from 'src/utils/id';

import { OfficialReport, OfficialReportDocumentNotStored, OfficialReportValidated } from './official-report';
import * as helpers from './official-report-test-utils';
import { OfficialReportSnapshot } from './snapshot/official-report-snapshot';

const VALIDATED_AT = new Date('2026-06-08T09:00:00.000Z');
const FIRST_VALIDATION = new Date('2026-06-08T08:00:00.000Z');

function makeReport(state: { isDocumentStored?: boolean; validatedAt?: Date | null } = {}): OfficialReport {
  return OfficialReport.from({
    id: makeId('OfficialReportId'),
    snapshot: OfficialReportSnapshot.from(helpers.makeSnapshot()),
    isDocumentStored: state.isDocumentStored ?? true,
    validatedAt: state.validatedAt ?? null,
  });
}

describe('OfficialReport', () => {
  it('records nothing as long as it is not validated', () => {
    expect(makeReport().messages).toEqual([]);
  });

  it('is validated at the given moment', () => {
    const report = makeReport();

    report.validate({ at: VALIDATED_AT });

    expect(report.messages).toEqual([new OfficialReportValidated(report.id, VALIDATED_AT)]);
  });

  it('refuses to be validated while its document is not stored', () => {
    const report = makeReport({ isDocumentStored: false });

    expect(() => report.validate({ at: VALIDATED_AT })).toThrow(OfficialReportDocumentNotStored);
    expect(report.messages).toEqual([]);
  });

  it('keeps the moment of its first validation', () => {
    const report = makeReport({ validatedAt: FIRST_VALIDATION });

    report.validate({ at: VALIDATED_AT });

    expect(report.messages).toEqual([]);
  });
});

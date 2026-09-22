import { makeId } from 'src/utils/id';

import {
  OfficialReport,
  OfficialReportAlreadyValidated,
  OfficialReportDocumentNotStored,
  OfficialReportDraftDiscarded,
  OfficialReportDraftOpened,
  OfficialReportIntroEdited,
  OfficialReportValidated,
  OfficialReportWithoutValidatedVersion,
} from './official-report';
import * as helpers from './official-report-test-utils';
import { OfficialReportSnapshot } from './snapshot/official-report-snapshot';

const AUTHOR = 'author-1';
const VALIDATED_AT = new Date('2026-06-08T09:00:00.000Z');

function makeReport(state: { isDocumentStored?: boolean; isValidated?: boolean } = {}): OfficialReport {
  return OfficialReport.from({
    id: makeId('OfficialReportId'),
    snapshot: OfficialReportSnapshot.from(helpers.makeSnapshot()),
    isDocumentStored: state.isDocumentStored ?? true,
    isValidated: state.isValidated ?? false,
  });
}

describe('OfficialReport', () => {
  it('records nothing as long as it is not validated', () => {
    expect(makeReport().messages).toEqual([]);
  });

  it('is validated at the given moment', () => {
    const report = makeReport();

    report.validate({ at: VALIDATED_AT, authorId: AUTHOR });

    expect(report.messages).toEqual([
      new OfficialReportValidated(report.id, VALIDATED_AT, makeId('AuthorId', AUTHOR)),
    ]);
  });

  it('refuses to be validated while its document is not stored', () => {
    const report = makeReport({ isDocumentStored: false });

    expect(() => report.validate({ at: VALIDATED_AT, authorId: AUTHOR })).toThrow(
      OfficialReportDocumentNotStored,
    );
    expect(report.messages).toEqual([]);
  });

  it('refuses to be validated twice', () => {
    const report = makeReport({ isValidated: true });

    expect(() => report.validate({ at: VALIDATED_AT, authorId: AUTHOR })).toThrow(
      OfficialReportAlreadyValidated,
    );
    expect(report.messages).toEqual([]);
  });

  describe('a validated report', () => {
    const validated = () => makeReport({ isValidated: true });

    it('should fork a draft before writing anything', () => {
      const report = validated();

      report.editIntro({ html: '<p>edited</p>', outdated: false });

      expect(report.messages).toEqual([
        new OfficialReportDraftOpened(report.id, null),
        new OfficialReportIntroEdited(report.id, '<p>edited</p>', false),
      ]);
    });

    it('should fork a single draft whatever the number of changes', () => {
      const report = validated();

      report.editIntro({ html: '<p>first</p>', outdated: false });
      report.editConclusion({ html: '<p>second</p>', outdated: false });
      report.resetFile({ nominationFileId: 'nf-1' });

      expect(report.messages.filter((m) => m instanceof OfficialReportDraftOpened)).toHaveLength(1);
    });

    it('should have nothing to discard', () => {
      const report = validated();

      report.discardDraft({ hasValidatedVersion: true });

      expect(report.messages).toEqual([]);
    });
  });

  describe('a draft report', () => {
    it('should not fork another draft', () => {
      const report = makeReport();

      report.editIntro({ html: '<p>edited</p>', outdated: false });

      expect(report.messages).toEqual([new OfficialReportIntroEdited(report.id, '<p>edited</p>', false)]);
    });

    it('should be discarded when a validated version remains underneath', () => {
      const report = makeReport();

      report.discardDraft({ hasValidatedVersion: true });

      expect(report.messages).toEqual([new OfficialReportDraftDiscarded(report.id)]);
    });

    it('should refuse to be discarded when nothing was ever validated', () => {
      const report = makeReport();

      expect(() => report.discardDraft({ hasValidatedVersion: false })).toThrow(
        OfficialReportWithoutValidatedVersion,
      );
      expect(report.messages).toEqual([]);
    });
  });
});

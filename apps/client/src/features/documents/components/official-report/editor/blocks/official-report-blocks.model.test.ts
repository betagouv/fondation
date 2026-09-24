import { describe, expect, it, vi } from 'vitest';

import * as $api from '@api/sdk';

import {
  OfficialReportEditionBlock,
  OfficialReportEditionBlockPersistor,
} from './official-report-blocks.model';

const UNTOUCHED = { agendaHtml: null, edited: false, generatedHtml: null };

describe('OfficialReportEditionBlock', () => {
  describe('#equals', () => {
    it('is true for identical intro blocks', () => {
      const a = new OfficialReportEditionBlock({
        ...UNTOUCHED,
        html: '<p>a</p>',
        key: 'intro',
        kind: 'intro',
        outdated: false,
      });
      const b = new OfficialReportEditionBlock({
        ...UNTOUCHED,
        html: '<p>a</p>',
        key: 'intro',
        kind: 'intro',
        outdated: false,
      });

      expect(a.equals(b)).toBe(true);
    });

    it('is false when only the outdated flag differs', () => {
      const acknowledged = new OfficialReportEditionBlock({
        ...UNTOUCHED,
        html: '<p>a</p>',
        key: 'intro',
        kind: 'intro',
        outdated: false,
      });
      const outdated = new OfficialReportEditionBlock({
        ...UNTOUCHED,
        html: '<p>a</p>',
        key: 'intro',
        kind: 'intro',
        outdated: true,
      });

      expect(acknowledged.equals(outdated)).toBe(false);
    });

    it('is false when the content differs', () => {
      const a = new OfficialReportEditionBlock({
        ...UNTOUCHED,
        html: '<p>a</p>',
        key: 'intro',
        kind: 'intro',
        outdated: false,
      });
      const b = new OfficialReportEditionBlock({
        ...UNTOUCHED,
        html: '<p>b</p>',
        key: 'intro',
        kind: 'intro',
        outdated: false,
      });

      expect(a.equals(b)).toBe(false);
    });

    it('compares section titles by text', () => {
      const base = {
        ...UNTOUCHED,
        key: 'section-title:VALIDATED',
        kind: 'section-title',
        outcome: 'VALIDATED',
      } as const;
      const a = new OfficialReportEditionBlock({ ...base, text: 'Titre' });
      const sameText = new OfficialReportEditionBlock({ ...base, text: 'Titre' });
      const otherText = new OfficialReportEditionBlock({ ...base, text: 'Autre' });

      expect(a.equals(sameText)).toBe(true);
      expect(a.equals(otherText)).toBe(false);
    });
  });

  describe('OfficialReportEditionBlockPersistor', () => {
    const persistor = new OfficialReportEditionBlockPersistor('report-1');

    it('re-adds the end-time class on the first conclusion paragraph', async () => {
      const editConclusion = vi
        .spyOn($api.docs, 'editOfficialReportConclusion')
        .mockResolvedValueOnce({ data: undefined, error: undefined });

      const block = new OfficialReportEditionBlock({
        ...UNTOUCHED,
        html: '<p>Fin de séance</p>',
        key: 'conclusion',
        kind: 'conclusion',
        outdated: false,
      });

      await persistor.persist(block);

      expect(editConclusion).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { officialReportId: 'report-1' },
          body: { html: '<p class="end-time">Fin de séance</p>', outdated: false },
        }),
      );
    });
  });
});

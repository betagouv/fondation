import { describe, expect, it, vi } from 'vitest';

import * as $api from '@api/sdk';

import {
  OfficialReportEditionBlock,
  OfficialReportEditionBlockPersistor,
} from './official-report-blocks.model';

describe('OfficialReportEditionBlock', () => {
  describe('#equals', () => {
    it('is true for identical intro blocks', () => {
      const a = new OfficialReportEditionBlock({
        kind: 'intro',
        key: 'intro',
        html: '<p>a</p>',
        outdated: false,
      });
      const b = new OfficialReportEditionBlock({
        kind: 'intro',
        key: 'intro',
        html: '<p>a</p>',
        outdated: false,
      });

      expect(a.equals(b)).toBe(true);
    });

    it('is false when only the outdated flag differs', () => {
      const acknowledged = new OfficialReportEditionBlock({
        kind: 'intro',
        key: 'intro',
        html: '<p>a</p>',
        outdated: false,
      });
      const outdated = new OfficialReportEditionBlock({
        kind: 'intro',
        key: 'intro',
        html: '<p>a</p>',
        outdated: true,
      });

      expect(acknowledged.equals(outdated)).toBe(false);
    });

    it('is false when the content differs', () => {
      const a = new OfficialReportEditionBlock({
        kind: 'intro',
        key: 'intro',
        html: '<p>a</p>',
        outdated: false,
      });
      const b = new OfficialReportEditionBlock({
        kind: 'intro',
        key: 'intro',
        html: '<p>b</p>',
        outdated: false,
      });

      expect(a.equals(b)).toBe(false);
    });

    it('compares section titles by text', () => {
      const base = { kind: 'section-title', key: 'section-title:VALIDATED', outcome: 'VALIDATED' } as const;
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
        kind: 'conclusion',
        key: 'conclusion',
        html: '<p>Fin de séance</p>',
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

    it('forwards html and outdated for a file block', async () => {
      const editFile = vi
        .spyOn($api.docs, 'editOfficialReportFile')
        .mockResolvedValue({ data: undefined, error: undefined });

      const block = new OfficialReportEditionBlock({
        kind: 'file',
        key: 'file:file-1',
        nominationFileId: 'file-1',
        html: '<p>Contenu</p>',
        outdated: true,
      });

      await persistor.persist(block);

      expect(editFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { officialReportId: 'report-1', nominationFileId: 'file-1' },
          body: { html: '<p>Contenu</p>', outdated: true },
        }),
      );
    });
  });
});

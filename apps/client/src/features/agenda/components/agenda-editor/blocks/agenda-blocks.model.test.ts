import { describe, expect, it, vi } from 'vitest';

import * as $api from '@api/sdk';

import { AgendaEditionBlock, AgendaEditionBlockPersistor } from './agenda-blocks.model';

describe('AgendaEditionBlock', () => {
  describe('#equals', () => {
    it('is true for identical file blocks', () => {
      const a = new AgendaEditionBlock({
        kind: 'file',
        key: 'file:1',
        fileId: '1',
        html: '<strong>a</strong>',
        outdated: false,
      });
      const b = new AgendaEditionBlock({
        kind: 'file',
        key: 'file:1',
        fileId: '1',
        html: '<strong>a</strong>',
        outdated: false,
      });

      expect(a.equals(b)).toBe(true);
    });

    it('is false when only the outdated flag differs', () => {
      const acknowledged = new AgendaEditionBlock({
        kind: 'file',
        key: 'file:1',
        fileId: '1',
        html: '<strong>a</strong>',
        outdated: false,
      });
      const outdated = new AgendaEditionBlock({
        kind: 'file',
        key: 'file:1',
        fileId: '1',
        html: '<strong>a</strong>',
        outdated: true,
      });

      expect(acknowledged.equals(outdated)).toBe(false);
    });

    it('is false when the content differs', () => {
      const a = new AgendaEditionBlock({
        kind: 'file',
        key: 'file:1',
        fileId: '1',
        html: '<strong>a</strong>',
        outdated: false,
      });
      const b = new AgendaEditionBlock({
        kind: 'file',
        key: 'file:1',
        fileId: '1',
        html: '<strong>b</strong>',
        outdated: false,
      });

      expect(a.equals(b)).toBe(false);
    });
  });

  describe('AgendaEditionBlockPersistor', () => {
    const persistor = new AgendaEditionBlockPersistor('agenda-1');

    it('forwards html and outdated for a file block', async () => {
      const editFile = vi
        .spyOn($api.docs, 'editAgendaFileBlock')
        .mockResolvedValue({ data: undefined, error: undefined });

      const block = new AgendaEditionBlock({
        kind: 'file',
        key: 'file:42',
        fileId: '42',
        html: '<strong>Contenu</strong>',
        outdated: true,
      });

      await persistor.persist(block);

      expect(editFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { agendaId: 'agenda-1', fileId: '42' },
          body: { html: '<strong>Contenu</strong>', outdated: true },
        }),
      );
    });

    it('resets a file block by its id', async () => {
      const resetFile = vi
        .spyOn($api.docs, 'resetAgendaFileBlock')
        .mockResolvedValue({ data: undefined, error: undefined });

      const block = new AgendaEditionBlock({
        kind: 'file',
        key: 'file:42',
        fileId: '42',
        html: '<strong>Contenu</strong>',
        outdated: false,
      });

      await persistor.reset(block);

      expect(resetFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: { agendaId: 'agenda-1', fileId: '42' },
        }),
      );
    });
  });
});

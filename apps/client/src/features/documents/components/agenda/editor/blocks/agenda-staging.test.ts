import { getSchema, type Editor } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAgendaExtensions } from '../agenda-tiptap-extensions';
import * as $api from '@api/sdk';

import { AgendaBlocksModel, AgendaEmptied } from './agenda-blocks.model';
import type { AgendaBlock } from './agenda-blocks.type';
import { AgendaFileBlock } from './AgendaFileBlock';

const PROPOSED = 'Mme GAMBIN Audrey au poste de substitute';

function agendaBlock(props: { edited?: boolean; id: number; text: string }): AgendaBlock {
  return {
    edited: props.edited ?? false,
    editedAt: null,
    generatedHtml: PROPOSED,
    html: props.text,
    id: String(props.id),
    kind: 'file',
    nominationFileId: `nf-${props.id}`,
    outdated: false,
    weight: props.id,
  };
}

/**
 * the model reads a document and a schema, never a rendered editor: this stands in for one so the
 * real diff and the real html serialisation run, without a browser or a node view.
 */
function editorHolding(blocks: readonly AgendaBlock[]): Editor {
  const schema = getSchema(buildAgendaExtensions({} as AgendaBlocksModel));
  const doc = PMNode.fromJSON(schema, {
    content: blocks.map((block) => ({
      attrs: {
        agendaId: 'agenda-1',
        edited: block.edited,
        editedAt: block.editedAt,
        fileId: block.id,
        generatedHtml: block.generatedHtml,
        isPending: false,
        outdated: block.outdated,
      },
      content: block.html ? [{ text: block.html, type: 'text' }] : [],
      type: AgendaFileBlock.name,
    })),
    type: 'doc',
  });

  return { schema, state: { doc } } as Editor;
}

function modelOn(blocks: readonly AgendaBlock[]) {
  const model = new AgendaBlocksModel({ agendaId: 'agenda-1', blocks });
  model.withEditor(editorHolding(blocks));

  return model;
}

describe('the agenda editor holds its changes back', () => {
  const editBlock = vi.spyOn($api.docs, 'editAgendaFileBlock');
  const resetBlock = vi.spyOn($api.docs, 'resetAgendaFileBlock');
  const keepFiles = vi.spyOn($api.docs, 'updateAgendaFiles');

  beforeEach(() => {
    editBlock.mockReset().mockResolvedValue({ data: undefined, error: undefined });
    resetBlock.mockReset().mockResolvedValue({ data: undefined, error: undefined });
    keepFiles.mockReset().mockResolvedValue({ data: undefined, error: undefined });
  });

  it('should send nothing while the reader writes', () => {
    const blocks = [agendaBlock({ id: 1, text: PROPOSED })];
    const model = modelOn(blocks);

    model.onEditorUpdate(editorHolding([agendaBlock({ id: 1, text: 'Mme GAMBIN Audrey au poste de juge' })]));

    expect(model.isDirty).toBe(true);
    expect(editBlock).not.toHaveBeenCalled();
    expect(resetBlock).not.toHaveBeenCalled();
    expect(keepFiles).not.toHaveBeenCalled();
  });

  it('should send nothing while the reader removes a proposition', () => {
    const blocks = [agendaBlock({ id: 1, text: PROPOSED }), agendaBlock({ id: 2, text: PROPOSED })];
    const model = modelOn(blocks);

    model.onEditorUpdate(editorHolding([agendaBlock({ id: 1, text: PROPOSED })]));

    expect(model.removedNominationFileIds).toEqual(['nf-2']);
    expect(keepFiles).not.toHaveBeenCalled();
  });

  it('should send the edition only once the reader saves', async () => {
    const blocks = [agendaBlock({ id: 1, text: PROPOSED })];
    const model = modelOn(blocks);

    model.onEditorUpdate(editorHolding([agendaBlock({ id: 1, text: 'Mme GAMBIN Audrey au poste de juge' })]));
    await model.save();

    expect(editBlock).toHaveBeenCalledTimes(1);
    expect(model.isDirty).toBe(false);
  });

  it('should forget the staged edition when the reader cancels', async () => {
    const blocks = [agendaBlock({ id: 1, text: PROPOSED })];
    const model = modelOn(blocks);

    model.onEditorUpdate(editorHolding([agendaBlock({ id: 1, text: 'Mme GAMBIN Audrey au poste de juge' })]));
    model.discard();
    await model.save();

    expect(editBlock).not.toHaveBeenCalled();
  });

  it('should leave an untouched block alone', async () => {
    const blocks = [agendaBlock({ id: 1, text: PROPOSED }), agendaBlock({ id: 2, text: PROPOSED })];
    const model = modelOn(blocks);

    model.onEditorUpdate(editorHolding(blocks));
    await model.save();

    expect(model.isDirty).toBe(false);
    expect(editBlock).not.toHaveBeenCalled();
    expect(resetBlock).not.toHaveBeenCalled();
    expect(keepFiles).not.toHaveBeenCalled();
  });

  it('should forget the undoing when the reader takes their own text back', async () => {
    const own = 'Mme GAMBIN Audrey au poste de juge';
    const model = modelOn([agendaBlock({ edited: true, id: 1, text: own })]);

    model.onEditorUpdate(editorHolding([agendaBlock({ edited: true, id: 1, text: PROPOSED })]));
    model.onEditorUpdate(editorHolding([agendaBlock({ edited: true, id: 1, text: own })]));
    await model.save();

    expect(model.isDirty).toBe(false);
    expect(resetBlock).not.toHaveBeenCalled();
    expect(editBlock).not.toHaveBeenCalled();
  });

  it('should undo a stored edition typed back to the proposed text', async () => {
    const blocks = [agendaBlock({ edited: true, id: 1, text: 'Mme GAMBIN Audrey au poste de juge' })];
    const model = modelOn(blocks);

    model.onEditorUpdate(editorHolding([agendaBlock({ edited: true, id: 1, text: PROPOSED })]));
    await model.save();

    expect(resetBlock).toHaveBeenCalledTimes(1);
    expect(editBlock).not.toHaveBeenCalled();
  });

  it('should refuse an emptied agenda without asking the server', async () => {
    const blocks = [agendaBlock({ id: 1, text: PROPOSED })];
    const model = modelOn(blocks);

    model.onEditorUpdate(editorHolding([agendaBlock({ id: 1, text: '' })]));

    await expect(model.save()).rejects.toBeInstanceOf(AgendaEmptied);
    expect(keepFiles).not.toHaveBeenCalled();
    expect(editBlock).not.toHaveBeenCalled();
  });
});

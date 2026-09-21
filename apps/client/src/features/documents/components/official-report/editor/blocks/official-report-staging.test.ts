import { getSchema, type Editor } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildOfficialReportExtensions } from '../official-report-tiptap-extensions';
import * as $api from '@api/sdk';

import { OfficialReportBlocksModel } from './official-report-blocks.model';
import type { OfficialReportBlock } from './official-report-blocks.type';
import { OfficialReportFileBlock } from './OfficialReportFileBlock';

const PROPOSED = 'Mme GAMBIN Audrey au poste de substitute';

function fileBlock(props: { edited?: boolean; id: number; text: string }): OfficialReportBlock {
  return {
    edited: props.edited ?? false,
    editedAt: null,
    fromAgenda: false,
    // the report writes its sentence bare, where the editor gives it back wrapped in a paragraph
    generatedHtml: PROPOSED,
    html: `<p>${props.text}</p>`,
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
function editorHolding(blocks: readonly OfficialReportBlock[]): Editor {
  const schema = getSchema(buildOfficialReportExtensions({} as OfficialReportBlocksModel));
  const doc = PMNode.fromJSON(schema, {
    content: [
      {
        content: blocks.map((block) => ({
          attrs: {
            edited: block.edited,
            generatedHtml: block.generatedHtml,
            isPending: false,
            nominationFileId: block.kind === 'file' ? block.nominationFileId : null,
            officialReportId: 'report-1',
            outdated: block.outdated,
          },
          content: [{ content: [{ text: textOf(block), type: 'text' }], type: 'paragraph' }],
          type: OfficialReportFileBlock.name,
        })),
        type: 'fileListBlock',
      },
    ],
    type: 'doc',
  });

  return { schema, state: { doc } } as Editor;
}

function textOf(block: OfficialReportBlock): string {
  return 'html' in block ? block.html.replace(/<[^>]*>/g, '') : '';
}

function modelOn(blocks: readonly OfficialReportBlock[]) {
  const model = new OfficialReportBlocksModel({ blocks, officialReportId: 'report-1' });
  model.withEditor(editorHolding(blocks));

  return model;
}

describe('the official report editor holds its changes back', () => {
  const editFile = vi.spyOn($api.docs, 'editOfficialReportFile');
  const resetFile = vi.spyOn($api.docs, 'resetOfficialReportFile');

  beforeEach(() => {
    editFile.mockReset().mockResolvedValue({ data: undefined, error: undefined });
    resetFile.mockReset().mockResolvedValue({ data: undefined, error: undefined });
  });

  it('should send nothing while the reader writes', () => {
    const model = modelOn([fileBlock({ id: 1, text: PROPOSED })]);

    model.onEditorUpdate(editorHolding([fileBlock({ id: 1, text: 'Mme GAMBIN Audrey au poste de juge' })]));

    expect(model.isDirty).toBe(true);
    expect(editFile).not.toHaveBeenCalled();
    expect(resetFile).not.toHaveBeenCalled();
  });

  it('should send the edition only once the reader saves', async () => {
    const model = modelOn([fileBlock({ id: 1, text: PROPOSED })]);

    model.onEditorUpdate(editorHolding([fileBlock({ id: 1, text: 'Mme GAMBIN Audrey au poste de juge' })]));
    await model.save();

    expect(editFile).toHaveBeenCalledTimes(1);
    expect(model.isDirty).toBe(false);
  });

  it('should forget the staged edition when the reader cancels', async () => {
    const model = modelOn([fileBlock({ id: 1, text: PROPOSED })]);

    model.onEditorUpdate(editorHolding([fileBlock({ id: 1, text: 'Mme GAMBIN Audrey au poste de juge' })]));
    model.discard();
    await model.save();

    expect(editFile).not.toHaveBeenCalled();
  });

  it('should leave an untouched block alone', async () => {
    const blocks = [fileBlock({ id: 1, text: PROPOSED }), fileBlock({ id: 2, text: PROPOSED })];
    const model = modelOn(blocks);

    model.onEditorUpdate(editorHolding(blocks));
    await model.save();

    expect(model.isDirty).toBe(false);
    expect(editFile).not.toHaveBeenCalled();
    expect(resetFile).not.toHaveBeenCalled();
  });

  it('should forget the undoing when the reader takes their own text back', async () => {
    const own = 'Mme GAMBIN Audrey au poste de juge';
    const model = modelOn([fileBlock({ edited: true, id: 1, text: own })]);

    model.onEditorUpdate(editorHolding([fileBlock({ edited: true, id: 1, text: PROPOSED })]));
    model.onEditorUpdate(editorHolding([fileBlock({ edited: true, id: 1, text: own })]));
    await model.save();

    expect(model.isDirty).toBe(false);
    expect(resetFile).not.toHaveBeenCalled();
    expect(editFile).not.toHaveBeenCalled();
  });

  it('should undo a stored edition typed back to the proposed text', async () => {
    const model = modelOn([fileBlock({ edited: true, id: 1, text: 'Mme GAMBIN Audrey au poste de juge' })]);

    model.onEditorUpdate(editorHolding([fileBlock({ edited: true, id: 1, text: PROPOSED })]));
    await model.save();

    expect(resetFile).toHaveBeenCalledTimes(1);
    expect(editFile).not.toHaveBeenCalled();
  });
});

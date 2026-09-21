import { getSchema } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';
import { DecorationSet } from '@tiptap/pm/view';
import { describe, expect, it } from 'vitest';

import { buildAgendaExtensions } from '../agenda/editor/agenda-tiptap-extensions';
import type { AgendaBlocksModel } from '../agenda/editor/blocks/agenda-blocks.model';
import { AgendaFileBlock } from '../agenda/editor/blocks/AgendaFileBlock';
import type { OfficialReportBlocksModel } from '../official-report/editor/blocks/official-report-blocks.model';
import { OfficialReportFileBlock } from '../official-report/editor/blocks/OfficialReportFileBlock';
import { OfficialReportIntroBlock } from '../official-report/editor/blocks/OfficialReportIntroBlock';
import { buildOfficialReportExtensions } from '../official-report/editor/official-report-tiptap-extensions';

import { changedWordsOf } from './changed-words';

const PROPOSED = 'Mme GAMBIN Audrey au poste de substitute';

/** an introduction as the report writes it: paragraphs, lists, and whitespace between the two */
const INTRO =
  "<p>Sous la présidence de Paul PARQUET, en présence des membres du Conseil supérieur de la magistrature suivants&nbsp;:</p><ul> <li>Mme Camille COMMUN</li> </ul><p><strong>En présence de&nbsp;:</strong></p><ul> <li>M.&nbsp;Serge GÉNÉRAL, secrétaire général adjoint</li> <li>Marie Dupont</li> </ul><p> Marie Dupont, indique renoncer au délai de convocation de huit jours prévus par l'article 35 du décret n°94-199 du 9&nbsp;mars&nbsp;1994 relatif au Conseil supérieur de la magistrature. </p><p> À 09:39, Paul PARQUET, déclare la séance ouverte. </p> ";

/** the agenda writes its text straight in the block, with nothing between it and the words */
function agendaDoc(text: string): PMNode {
  const schema = getSchema(buildAgendaExtensions({} as AgendaBlocksModel));

  return PMNode.fromJSON(schema, {
    content: [
      {
        attrs: { generatedHtml: PROPOSED },
        content: [{ text, type: 'text' }],
        type: AgendaFileBlock.name,
      },
    ],
    type: 'doc',
  });
}

/** the report wraps its text in paragraphs, each of which costs two positions of its own */
function officialReportDoc(paragraphs: readonly string[]): PMNode {
  const schema = getSchema(buildOfficialReportExtensions({} as OfficialReportBlocksModel));

  return PMNode.fromJSON(schema, {
    content: [
      {
        content: [
          {
            attrs: { generatedHtml: `<p>${PROPOSED}</p>` },
            content: paragraphs.map((text) => ({
              content: [{ text, type: 'text' }],
              type: 'paragraph',
            })),
            type: OfficialReportFileBlock.name,
          },
        ],
        type: 'fileListBlock',
      },
    ],
    type: 'doc',
  });
}

/** the whole block turns as soon as it differs; the words are marked one by one within it */
function wordsOf(doc: PMNode, blocks: Set<string>) {
  return changedWordsOf(doc, blocks).filter((decoration) => !decoration.spec?.blockRule);
}

describe('changedWordsOf', () => {
  it('should mark nothing on a block reading as the document proposes', () => {
    const doc = agendaDoc(PROPOSED);

    expect(changedWordsOf(doc, new Set([AgendaFileBlock.name]))).toEqual([]);
  });

  it('should mark the rewritten word where it is read', () => {
    const doc = agendaDoc('Mme GAMBIN Audrey au poste de juge');

    const [changed] = wordsOf(doc, new Set([AgendaFileBlock.name]));

    expect(doc.textBetween(changed!.from, changed!.to)).toBe('juge');
  });

  it('should mark the rewritten word across the paragraphs of a report block', () => {
    const doc = officialReportDoc(['Mme GAMBIN Audrey', 'au poste de juge']);

    const [changed] = wordsOf(doc, new Set([OfficialReportFileBlock.name]));

    expect(doc.textBetween(changed!.from, changed!.to)).toBe('juge');
  });

  it('should turn the whole block as soon as one of its words differs', () => {
    const doc = agendaDoc('Mme GAMBIN Audrey au poste de juge');
    const block = doc.firstChild!;

    const [rule] = changedWordsOf(doc, new Set([AgendaFileBlock.name])).filter(
      (decoration) => decoration.spec?.blockRule,
    );

    expect(rule).toMatchObject({ from: 0, to: block.nodeSize });
  });

  /** the editor drops the whitespace the template leaves between its paragraphs and its lists */
  it('should mark nothing in an untouched introduction of paragraphs and lists', () => {
    const extensions = buildOfficialReportExtensions({} as OfficialReportBlocksModel);
    const doc = PMNode.fromJSON(getSchema(extensions), {
      content: OfficialReportIntroBlock.map(
        'report-1',
        { edited: false, generatedHtml: INTRO, html: INTRO, kind: 'intro', outdated: false, weight: 0 },
        extensions,
      ),
      type: 'doc',
    });

    const marked = changedWordsOf(doc, new Set([OfficialReportIntroBlock.name])).map((decoration) =>
      doc.textBetween(decoration.from, decoration.to),
    );

    expect(marked).toEqual([]);
  });

  /** an out of range decoration would throw here, and take the whole editor down with it */
  it('should place every decoration inside the document', () => {
    const doc = officialReportDoc(['Mme GAMBIN', 'au poste de juge']);

    const decorations = changedWordsOf(doc, new Set([OfficialReportFileBlock.name]));

    expect(decorations.length).toBeGreaterThan(0);
    expect(() => DecorationSet.create(doc, decorations)).not.toThrow();
  });
});

import { load } from 'cheerio';

import { GenderEnum } from 'src/modules/shared/gender.enum';
import { DateOnly } from 'src/utils/date-only';

import { agendaBlocks, AgendaRenderContext, agendaTemplate } from './agenda.html';

describe('agendaTemplate', () => {
  const baseContext = {
    chairman: {
      firstName: `barbara`,
      lastName: 'mcclintock',
      gender: GenderEnum.FEMALE,
      title: 'PRESIDENT_SIEGE',
    },
    date: new DateOnly(2026, 7, 1),
    sessionMeetingDate: new DateOnly(2026, 7, 1),
    formation: 'SIEGE',
    nominationFiles: [
      {
        id: 1n,
        nominationFileId: 'nf-1',
        number: 1,
        name: `MME Émilie du CHÂTELET`,
        currentGrade: 'G3',
        currentPosition: "présidente à la cour d'appel de Lyon",
        targetedPosition: "présidente à la cour d'appel de Grenoble",
        targetedGrade: 'G3',
        reporters: ['MME Rosalind FRANKLIN'],
      },
    ],
    userDefinedBlocks: { files: new Map() },
  } satisfies AgendaRenderContext;

  it('should render', () => {
    const content = agendaTemplate.render(baseContext);

    const $ = load(content);
    expect($('main').html()).toMatchSnapshot();
  });

  // Zone independence is proven where the formatter lives, in helpers.spec: here we only check
  // that the rendering context carries the day it was given, rather than an instant
  it('dates the agenda on the day it was set', () => {
    const $ = load(agendaTemplate.render(baseContext));

    expect($('.date').text()).toBe('Séance du 1er juillet 2026');
    expect($('.redaction-place').text()).toBe('Fait à Paris, le 1er juillet 2026');
  });

  it('should render as blocks', () => {
    const blocks = Array.from(agendaBlocks(baseContext));
    expect(blocks).toMatchInlineSnapshot(`
      [
        {
          "edited": false,
          "editedAt": null,
          "editedBy": null,
          "generatedHtml": "<strong>MME Émilie du CHÂTELET</strong>, actuellement présidente à la cour d'appel de Lyon (G3), au poste de présidente à la cour d'appel de Grenoble (G3), au rapport de MME Rosalind FRANKLIN.",
          "html": "<strong>MME Émilie du CHÂTELET</strong>, actuellement présidente à la cour d'appel de Lyon (G3), au poste de présidente à la cour d'appel de Grenoble (G3), au rapport de MME Rosalind FRANKLIN.",
          "id": 1n,
          "kind": "file",
          "nominationFileId": "nf-1",
          "outdated": false,
          "weight": 1,
        },
      ]
    `);
  });

  it('should render generatedHtml when the html is edited and outdated', () => {
    const blocks = Array.from(
      agendaBlocks({
        ...baseContext,

        userDefinedBlocks: {
          files: new Map([
            [
              1n,
              {
                html: `<span>custom html</span>`,
                isOutdated: true,
                editedAt: new Date('2026-03-12T10:00:00.000Z'),
                editedBy: null,
              },
            ],
          ]),
        },
      }),
    );

    expect(blocks).toMatchInlineSnapshot(`
      [
        {
          "edited": true,
          "editedAt": 2026-03-12T10:00:00.000Z,
          "editedBy": null,
          "generatedHtml": "<strong>MME Émilie du CHÂTELET</strong>, actuellement présidente à la cour d'appel de Lyon (G3), au poste de présidente à la cour d'appel de Grenoble (G3), au rapport de MME Rosalind FRANKLIN.",
          "html": "<span>custom html</span>",
          "id": 1n,
          "kind": "file",
          "nominationFileId": "nf-1",
          "outdated": true,
          "weight": 1,
        },
      ]
    `);
  });

  it('should not credit the reader for a block reading as the agenda proposes', () => {
    const [proposed] = Array.from(agendaBlocks(baseContext));

    const blocks = Array.from(
      agendaBlocks({
        ...baseContext,
        userDefinedBlocks: {
          files: new Map([
            [
              1n,
              {
                // the editor gives the text back wrapped and spaced its own way
                html: `<p>${proposed!.html}</p>`,
                isOutdated: false,
                editedAt: new Date('2026-03-12T10:00:00.000Z'),
                editedBy: null,
              },
            ],
          ]),
        },
      }),
    );

    expect(blocks[0]).toMatchObject({ edited: false, editedAt: null });
  });
});

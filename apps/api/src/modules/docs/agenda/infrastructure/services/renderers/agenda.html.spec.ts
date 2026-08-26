import { load } from 'cheerio';

import { GenderEnum } from 'src/modules/shared/gender.enum';
import { DateOnly } from 'src/utils/date-only';

import { agendaBlocks, AgendaRenderContext, agendaTemplate } from './agenda.html';

describe('agendaTemplate', () => {
  const baseContext = {
    chairman: { firstName: `léon`, lastName: 'blum', gender: GenderEnum.MALE, title: 'PRESIDENT_SIEGE' },
    date: new DateOnly(2026, 7, 1),
    sessionMeetingDate: new DateOnly(2026, 7, 1),
    formation: 'SIEGE',
    nominationFiles: [
      {
        id: 1n,
        number: 1,
        name: `MME Simone Veil`,
        currentGrade: 'G3',
        currentPosition: "présidente à la cour d'appel de Lyon",
        targetedPosition: "présidente à la cour d'appel de Grenoble",
        targetedGrade: 'G3',
        reporters: ['M. Michel FOUCAULT'],
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
          "generatedHtml": undefined,
          "html": "<strong>MME Simone Veil</strong>, actuellement présidente à la cour d'appel de Lyon (G3), au poste de présidente à la cour d'appel de Grenoble (G3), au rapport de M. Michel FOUCAULT.",
          "id": 1n,
          "kind": "file",
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
          files: new Map([[1n, { html: `<span>custom html</span>`, isOutdated: true }]]),
        },
      }),
    );

    expect(blocks).toMatchInlineSnapshot(`
      [
        {
          "edited": true,
          "generatedHtml": "<strong>MME Simone Veil</strong>, actuellement présidente à la cour d'appel de Lyon (G3), au poste de présidente à la cour d'appel de Grenoble (G3), au rapport de M. Michel FOUCAULT.",
          "html": "<span>custom html</span>",
          "id": 1n,
          "kind": "file",
          "outdated": true,
          "weight": 1,
        },
      ]
    `);
  });
});

import { http, HttpResponse } from 'msw';

import type {
  DetailedHelpPageDto,
  HelpPageEnum,
  IncludedFilesInHelpPageContentDto,
  WriteHelpPageContentDto,
} from '@api/types';

import { STORY_AUTHORS } from './story-users';

export const HELP_PAGE_STATES = ['WRITTEN', 'BLANK'] as const;
export type HelpPageState = (typeof HELP_PAGE_STATES)[number];

const SCREENSHOT_ID = 'help-screenshot-1';

// an inline image: about:blank would show as broken and a file address would need the files route
function placeholderScreenshot(label: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="200">' +
    '<rect width="100%" height="100%" fill="#e3e3fd"/>' +
    `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#000091">${label}</text>` +
    '</svg>';

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const INTRODUCTIONS: Record<HelpPageEnum, string> = {
  MEMBRE:
    "<p>Ce guide s'adresse aux membres du Conseil. Il suit le parcours d'une transparence, de la réception des dossiers à la validation du procès-verbal.</p>",
  SECRETARIAT_GENERAL:
    "<p>Ce guide s'adresse au secrétariat général. Il suit le parcours d'une transparence, de l'import de l'archive LOLFI à l'archivage de la session.</p>",
};

const ARTICLE =
  '<h1 data-id="prise-en-main"><strong>🎯 1. Prise en main</strong></h1>' +
  "<p>Fondation accompagne les sessions du Conseil supérieur de la magistrature. Chaque <strong>session</strong> regroupe les <strong>dossiers</strong> d'une <strong>transparence</strong> et les <strong>propositions</strong> du garde des Sceaux.</p>" +
  "<aside><p>Un dossier n'est visible qu'une fois affecté à un rapporteur, sauf pour le secrétariat général qui voit la session entière.</p></aside>" +
  '<h2 data-id="tableau-de-bord">1.1 Le tableau de bord</h2>' +
  `<p>Le tableau de bord liste les dossiers de la session en cours, avec leurs priorités et leur issue.</p><img alt="Le tableau de bord d'une session" data-file-id="${SCREENSHOT_ID}" data-file-name="tableau-de-bord.png">` +
  '<h2 data-id="priorites">1.2 Les priorités</h2>' +
  '<table><tbody><tr><th>Priorité</th><th>Signification</th></tr>' +
  '<tr><td>Étoile</td><td>Dossier signalé par le ministère</td></tr>' +
  '<tr><td>Audition</td><td>Le candidat est entendu par la formation</td></tr>' +
  '<tr><td>Réserve</td><td>Un avis défavorable est envisagé</td></tr></tbody></table>' +
  '<hr>' +
  '<h1 data-id="documents"><strong>📄 2. Les documents</strong></h1>' +
  '<p>Les ordres du jour et les procès-verbaux se rédigent depuis l\'onglet Documents de la session. Le détail des règles est dans <a href="#priorites">la section sur les priorités</a> et sur <a href="https://www.conseil-superieur-magistrature.fr/">le site du Conseil</a>.</p>' +
  '<h2 data-id="ordre-du-jour">2.1 L\'ordre du jour</h2>' +
  "<p>Un ordre du jour reste partagé entre les brouillons jusqu'à sa première validation.</p>" +
  '<h2 data-id="proces-verbal">2.2 Le procès-verbal</h2>' +
  "<p>Le procès-verbal reprend les issues des dossiers de l'ordre du jour validé.</p>";

function makeHelpPage(page: HelpPageEnum, state: HelpPageState): DetailedHelpPageDto {
  return {
    content: state === 'WRITTEN' ? INTRODUCTIONS[page] + ARTICLE : '<p></p>',
    screenshots: [
      {
        id: SCREENSHOT_ID,
        name: 'tableau-de-bord.png',
        type: 'image/png',
        url: placeholderScreenshot('Capture du tableau de bord'),
      },
    ],
    updatedAt: '2026-10-20T09:15:00.000Z',
    updatedBy: state === 'WRITTEN' ? STORY_AUTHORS.sg : null,
  };
}

// the pages live for the story: what is saved is read back on the next load, as with the API
export function helpPageHandlers(state: HelpPageState) {
  const pages: Record<HelpPageEnum, DetailedHelpPageDto> = {
    MEMBRE: makeHelpPage('MEMBRE', state),
    SECRETARIAT_GENERAL: makeHelpPage('SECRETARIAT_GENERAL', state),
  };
  const pageOf = (param: string | readonly string[] | undefined) => pages[String(param) as HelpPageEnum];

  return [
    http.get('*/api/help/v1/pages/:page', ({ params }) => HttpResponse.json(pageOf(params.page))),
    http.put('*/api/help/v1/pages/:page/content', async ({ params, request }) => {
      const { content } = (await request.json()) as WriteHelpPageContentDto;
      Object.assign(pageOf(params.page), {
        content,
        updatedAt: new Date().toISOString(),
        updatedBy: STORY_AUTHORS.sg,
      });

      return new HttpResponse(null, { status: 204 });
    }),
    http.post('*/api/help/v1/pages/:page/screenshots', async ({ params, request }) => {
      const files = (await request.formData()).getAll('files').filter((file) => file instanceof File);
      const items = files.map((file, index) => ({
        id: `pasted-${Date.now()}-${index}`,
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      }));
      pageOf(params.page).screenshots.push(...items);

      return HttpResponse.json<IncludedFilesInHelpPageContentDto>({ items }, { status: 201 });
    }),
  ];
}

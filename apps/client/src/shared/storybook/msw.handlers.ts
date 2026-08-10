import { http, HttpResponse } from 'msw';

import type {
  CreatedSummaryDto,
  DetailedNominationFileAttachmentDto,
  DetailedUserResponseDto,
  GeneratedSummaryAttachmentPublicUrlDto,
  GetObservationFileUrlResponseDto,
} from '@api/types';

const noContent = () => new HttpResponse(null, { status: 204 });

// Opened in a new tab by the components, about:blank keeps the interaction inert
const FILE_URL = 'about:blank';

const STORY_USER: DetailedUserResponseDto = {
  displayTitle: null,
  duty: null,
  firstName: 'Inès',
  gender: 'FEMALE',
  isImpersonated: false,
  lastName: 'Fontaine',
  role: 'MEMBRE_COMMUN',
  title: null,
  userId: 'user-1',
};

export const authHandlers = [
  http.get('*/api/auth/v2/introspect', () => HttpResponse.json<DetailedUserResponseDto>(STORY_USER)),
];

export const sidePanelHandlers = [
  http.put('*/api/sessions/v2/:sessionId/files/:nominationFileId/audition/schedule', noContent),
  http.patch('*/api/sessions/v2/:sessionId/files/:nominationFileId/comment', noContent),
  http.put('*/api/sessions/v2/:sessionId/files/:nominationFileId/missing-evaluation', noContent),
  http.put('*/api/sessions/v2/:sessionId/files/:nominationFileId/outcome', noContent),
  http.put(
    '*/api/members/v1/:userId/sessions/transparence/garde-des-sceaux/:sessionId/files/:nominationFileId/memo',
    noContent,
  ),

  http.post('*/api/sessions/v2/:sessionId/files/:nominationFileId/summary', () =>
    HttpResponse.json<CreatedSummaryDto>({ id: 'summary-1' }, { status: 201 }),
  ),

  http.get('*/api/sessions/v2/:sessionId/files/:nominationFileId/attachments/:fileId', ({ params }) =>
    HttpResponse.json<DetailedNominationFileAttachmentDto>({
      id: String(params.fileId),
      name: 'document.pdf',
      url: FILE_URL,
    }),
  ),
  http.get(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/observations/:observationId/files/:fileId/url',
    ({ params }) =>
      HttpResponse.json<GetObservationFileUrlResponseDto>({
        id: String(params.fileId),
        name: 'document.pdf',
        url: FILE_URL,
      }),
  ),
  http.get(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/summary/attachments/:fileId/url',
    ({ params }) =>
      HttpResponse.json<GeneratedSummaryAttachmentPublicUrlDto>({
        id: String(params.fileId),
        name: 'document.pdf',
        type: 'application/pdf',
        url: FILE_URL,
      }),
  ),
];

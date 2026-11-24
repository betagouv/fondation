import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { PageStory } from '@/shared/storybook/PageStory';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type {
  CreatedApiClientDto,
  ListedApiClientChangesDto,
  ListedApiClientsDto,
  RotatedApiClientSecretDto,
} from '@api/types';

import { AdminApiClientsPage } from './AdminApiClientsPage';

const SCOPES: ListedApiClientsDto['scopes'] = [
  {
    defaultLimitPerMinute: 20,
    id: 'magistrats:identification',
    label: 'Identifier un magistrat par son adresse professionnelle',
  },
  { defaultLimitPerMinute: 300, id: 'magistrats:status', label: "Relire le statut d'un magistrat" },
];

const CLIENTS: ListedApiClientsDto['items'] = [
  {
    allowedIps: [{ ip: '203.0.113.7' }, { ip: '2001:db8::1' }],
    authLimitPerMinute: 10,
    canEndSecretRotation: false,
    canRevoke: true,
    canRotateSecret: true,
    canUpdate: true,
    id: '0b3c6f9e-6a1d-4f53-9a2e-5c8f1d2b7a41',
    lastTokenIssuedAt: '2026-11-23T08:45:00.000Z',
    name: 'Site du CSM',
    scopes: [
      { limitPerMinute: 20, scope: SCOPES[0]! },
      { limitPerMinute: 300, scope: SCOPES[1]! },
    ],
    status: { value: 'ACTIVE' },
  },
  {
    allowedIps: [{ ip: '198.51.100.12' }],
    authLimitPerMinute: 10,
    canEndSecretRotation: true,
    canRevoke: true,
    canRotateSecret: false,
    canUpdate: true,
    id: '7e2a9c14-3b8f-4d6a-8c1e-2f5b9a0d3e77',
    lastTokenIssuedAt: '2026-11-22T17:10:00.000Z',
    name: 'Recette du site du CSM',
    scopes: [{ limitPerMinute: 20, scope: SCOPES[0]! }],
    status: { until: '2026-11-30T09:00:00.000Z', value: 'ROTATING' },
  },
  {
    allowedIps: [{ ip: '192.0.2.44' }],
    authLimitPerMinute: 10,
    canEndSecretRotation: false,
    canRevoke: false,
    canRotateSecret: false,
    canUpdate: false,
    id: 'c41d8e2f-9a6b-4e3c-b7d1-0f2a5c8e6b93',
    lastTokenIssuedAt: null,
    name: 'Ancien prestataire',
    scopes: [],
    status: { since: '2026-11-02T14:00:00.000Z', value: 'REVOKED' },
  },
];

const CHANGES: ListedApiClientChangesDto['items'] = [
  {
    change: { id: 'SECRET_ROTATION_STARTED', label: 'Rotation du secret lancée' },
    changedAt: '2026-11-23T09:15:00.000Z',
    changedBy: { id: 'b6f0c2a4-1d3e-4f5a-9b7c-8d2e1f0a3c55', name: 'Alice ADMIN' },
    previousSecretValidUntil: '2026-11-30T09:15:00.000Z',
  },
  {
    change: { id: 'UPDATED', label: 'Modification des IP, des routes ou des limites' },
    changedAt: '2026-11-23T08:30:00.000Z',
    previousSecretValidUntil: null,
    changedBy: { id: 'b6f0c2a4-1d3e-4f5a-9b7c-8d2e1f0a3c55', name: 'Alice ADMIN' },
  },
  {
    change: { id: 'CREATED', label: 'Création' },
    changedAt: '2026-11-18T10:00:00.000Z',
    changedBy: { id: 'c1a2b3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d', name: 'Simon SECRETARIAT' },
    previousSecretValidUntil: null,
  },
];

function AdminApiClientsPageStory(props: { empty: boolean }) {
  return (
    // a fresh page asks the list again when the control changes
    <PageStory
      key={String(props.empty)}
      location={ROUTE_PATHS.ADMIN.API_CLIENTS}
      path={ROUTE_PATHS.ADMIN.API_CLIENTS}
      view="sg"
    >
      <AdminApiClientsPage />
    </PageStory>
  );
}

const meta = {
  args: { empty: false },
  argTypes: { empty: { control: 'boolean', description: "Aucun client n'est encore créé." } },
  beforeEach: ({ args, msw }) => {
    msw.use(
      http.get('*/api/administration/v1/api-clients', () =>
        HttpResponse.json<ListedApiClientsDto>({
          items: args.empty ? [] : CLIENTS,
          scopes: SCOPES,
          limitPerMinute: { min: 1, max: 10_000 },
          secretRotationDays: { default: 7, max: 30 },
        }),
      ),
      http.post('*/api/administration/v1/api-clients', () =>
        HttpResponse.json<CreatedApiClientDto>(
          { id: '5f1e3a7c-2d4b-4c8e-9a6f-1b3d5e7f9a02', secret: 'secret-de-demonstration-du-nouveau-client' },
          { status: 201 },
        ),
      ),
      http.post('*/api/administration/v1/api-clients/:clientId/secret-rotation', () =>
        HttpResponse.json<RotatedApiClientSecretDto>(
          {
            previousSecretValidUntil: '2026-11-30T09:00:00.000Z',
            secret: 'secret-de-demonstration-apres-rotation',
          },
          { status: 201 },
        ),
      ),
      http.get('*/api/administration/v1/api-clients/:clientId/changes', () =>
        HttpResponse.json<ListedApiClientChangesDto>({ items: CHANGES }),
      ),
      http.put(
        '*/api/administration/v1/api-clients/:clientId',
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.delete(
        '*/api/administration/v1/api-clients/:clientId/secret-rotation',
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.put(
        '*/api/administration/v1/api-clients/:clientId/revocation',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
  },
  component: AdminApiClientsPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/ApiClients',
} satisfies Meta<typeof AdminApiClientsPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};

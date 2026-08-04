import { type Client, createClient, createConfig } from './generated/api/client/index.ts';
import * as api from './generated/api/sdk.ts';

type RemoveNever<T> = {
  [K in keyof T as [T[K]] extends [never] ? never : K]: T[K];
};
type RemoveEmpty<T> = T extends Record<string, never> ? never : T;
type Complement<T, U> = RemoveEmpty<
  RemoveNever<{
    [K in keyof T]: RemoveEmpty<{
      [KK in keyof T[K] as K extends keyof U ? (KK extends keyof U[K] ? never : KK) : KK]: T[K][KK];
    }>;
  }>
>;

export type TestSteps = typeof api & { ['@client']: Client; ['@user']: { id: string } | undefined };
export type TestStepsMember = Pick<TestSteps, 'reports' | 'files' | '@client' | '@user'> & {
  auth: Pick<(typeof api)['auth'], 'introspectSession' | 'logout'>;
  summaries: Pick<TestSteps['summaries'], 'detailSummary' | 'detachSummaryFiles' | 'generateAttachmentPublicUrl'>;
  members: Pick<
    TestSteps['members'],
    | 'listMemberSessionReports'
    | 'listMemberSessions'
    | 'searchNominationFileMembersReport'
    | 'writeNominationFileMemberMemo'
  >;
  observations: Pick<
    TestSteps['observations'],
    'listObservations' | 'getObservationDetails' | 'getObservationFileUrl' | 'listObservationsAttachments'
  >;
};

export type TestStepsAdmin = Omit<TestSteps, 'members'> & {
  members: Omit<
    (typeof api)['members'],
    'listMemberSessionReports' | 'listMemberSessions' | 'writeNominationFileMemberMemo'
  >;
};

export type TestStepsAgent = Omit<
  Complement<TestSteps, TestStepsMember> & {
    auth: Omit<(typeof api)['auth'], 'login' | 'listOpenIdProviders' | 'prepareOpenIdRequest' | 'callback'>;
  },
  'administration' | 'ingest'
>;

function createSdk(client: Client, user?: { id: string }): TestSteps {
  return new Proxy(api as TestSteps, {
    get(target, property, receiver) {
      if (property === '@client') return client;
      if (property === '@user') return user;

      const ns = Reflect.get(target, property, receiver);
      if (!ns) return ns;

      return new Proxy(ns as object, {
        get(subTarget, subProperty, subReceiver) {
          const fn = Reflect.get(subTarget, subProperty, subReceiver);
          if (typeof fn !== 'function') return fn;

          return (opts: object = {}) => fn({ client, ...opts });
        },
      });
    },
  });
}

export function makeStepsFixtures(
  options: Partial<{ baseUrl: string; cookies: string[]; user: { id: string } }> = {},
): TestSteps {
  return createSdk(
    createClient(createConfig({ baseUrl: options.baseUrl, headers: { cookie: options.cookies } })),
    options.user,
  );
}

export function makeHttpClient(baseUrl: string): Client {
  return createClient(createConfig({ baseUrl }));
}

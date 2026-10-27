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
export type TestStepsMember = Pick<TestSteps, 'archivedSessions' | 'reports' | 'files' | '@client' | '@user'> & {
  auth: Pick<(typeof api)['auth'], 'introspectSession' | 'logout'>;
  feedback: Pick<TestSteps['feedback'], 'answerFeedback' | 'findFeedback'>;
  help: Pick<TestSteps['help'], 'detailHelpPage'>;
  summaries: Pick<TestSteps['summaries'], 'detailSummary' | 'generateAttachmentPublicUrl'>;
  members: Pick<
    TestSteps['members'],
    | 'listMemberSessionReports'
    | 'listMemberSessions'
    | 'searchNominationFileMembersReport'
    | 'writeNominationFileMemberMemo'
  >;
  observations: Pick<
    TestSteps['observations'],
    | 'attachMemberCommentScreenshots'
    | 'getObservationDetails'
    | 'getObservationFileUrl'
    | 'listObservations'
    | 'writeMemberComment'
  >;
};

export type TestStepsAdmin = Omit<TestSteps, 'members'> & {
  members: Omit<
    (typeof api)['members'],
    'listMemberSessionReports' | 'listMemberSessions' | 'writeNominationFileMemberMemo'
  >;
};

// an intersection merges the keys of a namespace: one narrowed below must first leave the complement
export type TestStepsAgent = Omit<
  Complement<TestSteps, TestStepsMember>,
  'administration' | 'auth' | 'feedback' | 'help' | 'ingest' | 'jobs' | 'magistrats'
> & {
  archivedSessions: TestSteps['archivedSessions'];
  auth: Omit<
    (typeof api)['auth'],
    'callback' | 'impersonate' | 'listOpenIdProviders' | 'login' | 'prepareOpenIdRequest'
  >;
  feedback: Omit<TestSteps['feedback'], 'listFeedbacksAsExcel'>;
  // the secretariat also opens the attachments it serves
  files: TestSteps['files'];
  help: TestStepsMember['help'];
  magistrats: Omit<TestSteps['magistrats'], 'searchMagistratAuthorization'>;
  // the secretariat also reads the observations it receives
  observations: TestSteps['observations'];
  // the secretariat also reads the summaries it writes
  summaries: Pick<TestSteps['summaries'], 'detailSummary'>;
  ['@user']: TestSteps['@user'];
};

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

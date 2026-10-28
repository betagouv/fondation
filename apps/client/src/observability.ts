import type { Breadcrumb, BrowserOptions, Event } from '@sentry/react';

// Every key is set: as soon as dataCollection is given, the missing ones collect everything, cookies and bodies included.
// dataCollection only filters the span attributes of the SDK 10.75: the breadcrumbs, the request of the events and the name
// of the resource spans keep the raw URLs, which for the screenshots carry an S3 signature
export const WITHOUT_PERSONAL_DATA = {
  beforeBreadcrumb: withoutQueryInBreadcrumb,
  beforeSend: withoutQueryInRequest,
  beforeSendTransaction: withoutQueryInTransaction,
  dataCollection: {
    cookies: false,
    databaseQueryData: false,
    frameContextLines: 7,
    genAI: { inputs: false, outputs: false },
    graphQL: { document: true, variables: true },
    httpBodies: [],
    httpHeaders: false,
    stackFrameVariables: true,
    urlQueryParams: false,
    userInfo: false,
  },
} satisfies BrowserOptions;

function withoutQueryInBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (!breadcrumb.data) return breadcrumb;

  const data = { ...breadcrumb.data };
  for (const key of ['from', 'to', 'url']) {
    if (typeof data[key] === 'string') data[key] = withoutQuery(data[key]);
  }
  return { ...breadcrumb, data };
}

function withoutQueryInRequest<T extends Event>(event: T): T {
  const { request } = event;
  if (request?.url) request.url = withoutQuery(request.url);
  if (request?.headers?.Referer) request.headers.Referer = withoutQuery(request.headers.Referer);
  return event;
}

function withoutQueryInTransaction<T extends Event>(event: T): T {
  for (const span of event.spans ?? []) {
    if (span.op?.startsWith('resource.') && span.description) {
      span.description = withoutQuery(span.description);
    }
  }
  return withoutQueryInRequest(event);
}

function withoutQuery(url: string): string {
  return url.split(/[?#]/, 1)[0];
}

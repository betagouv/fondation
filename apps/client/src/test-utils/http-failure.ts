import { httpAssert } from '@/utils/http-exception';

/** the exception a request answering this status throws */
export function failureWith(status: number): unknown {
  try {
    httpAssert(new Response(null, { status }));
  } catch (exception) {
    return exception;
  }
}

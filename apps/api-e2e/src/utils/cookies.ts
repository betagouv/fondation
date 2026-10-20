/** the session cookies a response sets, as a request sends them back: an expired one is dropped, like a browser does */
export function cookieHeader(response: Response): string {
  return response.headers
    .getSetCookie()
    .filter((cookie) => {
      const expires = /Expires=([^;]+)/i.exec(cookie)?.[1];
      return !expires || new Date(expires).getTime() > Date.now();
    })
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

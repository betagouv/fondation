import { loggableUrl } from './http';

describe('loggableUrl', () => {
  it.each`
    url                                                         | expected
    ${'https://chat.example/hooks/fake-path'}                   | ${'https://chat.example/hooks/***'}
    ${'https://auth.scalingo.com/v1/tokens/exchange?token=abc'} | ${'https://auth.scalingo.com/v1/tokens/exchange'}
    ${'http://localhost:9091/forms/chromium/convert/html'}      | ${'http://localhost:9091/forms/chromium/convert/html'}
  `('should log "$url" as "$expected"', ({ url, expected }) => {
    expect(loggableUrl(url)).toBe(expected);
  });
});

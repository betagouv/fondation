import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { Mock } from 'vitest';

import { ApiConfig } from './config';
import { Tchap } from './tchap';

const TCHAP = {
  accessToken: 'secret',
  homeserverUrl: 'https://matrix.example',
  roomId: '!room:matrix.example',
} satisfies ApiConfig['tchap'];

function tchapWith(config: Pick<ApiConfig, 'tchap'>): [Tchap, Mock<HttpService['put']>] {
  const put = vi.fn<HttpService['put']>(() => of({} as AxiosResponse));
  const http = { put } as unknown as HttpService;

  return [new Tchap(http, config as ApiConfig), put];
}

describe('Tchap', () => {
  it('should post the alert in the room, as plain text and as HTML', async () => {
    const [tchap, put] = tchapWith({ tchap: TCHAP });

    expect(
      await tchap.alert({ text: 'Le job <1> a échoué\nhttps://fondation.test', title: 'Ingestion' }),
    ).toBe(true);

    expect(put).toHaveBeenCalledOnce();
    const [url, message, options] = put.mock.calls[0]!;
    expect(url).toMatch(
      /^https:\/\/matrix\.example\/_matrix\/client\/v3\/rooms\/!room%3Amatrix\.example\/send\/m\.room\.message\/[\w-]+$/,
    );
    expect(message).toEqual({
      body: 'Ingestion\n\nLe job <1> a échoué\nhttps://fondation.test',
      format: 'org.matrix.custom.html',
      formatted_body: '<strong>Ingestion</strong><br><br>Le job &lt;1&gt; a échoué<br>https://fondation.test',
      msgtype: 'm.text',
    });
    expect(options?.headers).toEqual({ authorization: 'Bearer secret' });
  });

  it('should send nothing without a configured room', async () => {
    const [tchap, put] = tchapWith({ tchap: undefined });

    expect(await tchap.alert({ text: 'text', title: 'title' })).toBe(false);
    expect(put).not.toHaveBeenCalled();
  });

  it('should report a failed delivery instead of throwing', async () => {
    const [tchap, put] = tchapWith({ tchap: TCHAP });
    put.mockReturnValueOnce(throwError(() => new Error('403')));

    expect(await tchap.alert({ text: 'text', title: 'title' })).toBe(false);
  });
});

import { generateLolfiArchive, type LolfiData } from 'lolfi';

import type { TestApp } from './test-app';

class LolfiIngestPage {
  constructor(private readonly app: TestApp) {}

  async goto(): Promise<this> {
    await this.app.nav.getByText('Administration').click();
    await this.app.page.getByText('Import LOLFI manuel').click();
    await this.app.page.getByRole('heading', { name: 'Ingérer une archive LOLFI' }).waitFor();

    return this;
  }

  async upload(data: LolfiData): Promise<void> {
    const archive = await generateLolfiArchive(data);
    await this.app.page.getByLabel('Archive LOLFI').setInputFiles([
      {
        buffer: archive,
        mimeType: 'application/zip',
        name: `LOLFI_CSM_${crypto.randomUUID().replaceAll('-', '')}.zip`,
      },
    ]);

    const lolfiIngestionPromise = this.app.page.waitForResponse('**/api/ingest/v1/lolfi');

    await this.app.page.getByRole('button', { name: 'Enregistrer' }).click();
    await this.app.page.getByRole('heading', { level: 2, name: 'Ingestions' }).waitFor();

    let { id: jobId } = await (await lolfiIngestionPromise).json();

    for (let retry = 10; retry >= 0; retry--) {
      const res = await this.app.page.request.get(`/api/jobs/v1/${jobId}`);
      const { status } = await res.json();
      if (!['RUNNING', 'IDLE'].includes(status)) return;

      await this.app.page.waitForTimeout(300);
    }

    throw new Error(`Could not`);
  }
}

export class AdminPage {
  constructor(private readonly app: TestApp) {}

  goto(page: 'newIngestion'): Promise<LolfiIngestPage> {
    switch (page) {
      case 'newIngestion':
        return new LolfiIngestPage(this.app).goto();
    }
  }
}

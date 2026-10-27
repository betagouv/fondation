import { test } from '../fixtures.ts';
import { makeFile } from '../utils/files.ts';
import { isStored } from '../utils/screenshots.ts';

test.describe('Help E2E', () => {
  test('should let an admin write a help page that every user reads with its screenshots', async ({
    admin,
    expect,
    member,
  }) => {
    const path = { page: 'MEMBRE' as const };

    const included = await admin.help.includeFilesInHelpPageContent({
      body: { files: [makeFile({ name: 'capture.png', type: 'image/png' })] },
      path,
      throwOnError: true,
    });
    const [screenshot] = included.data.items;

    const content =
      `<h1 data-id="traiter">Traiter un dossier</h1><p>Étapes, voir <a href="#profils">les profils</a></p>` +
      `<img data-file-id="${screenshot!.id}" src="${screenshot!.url}"><hr>` +
      `<h2 data-id="profils">Profils</h2><table><tbody><tr><th>Profil</th><th>Sessions</th></tr>` +
      `<tr><td>Membre siège</td><td>Formation siège</td></tr></tbody></table><aside><p>À savoir</p></aside>`;
    const written = await admin.help.writeHelpPageContent({ body: { content }, path });
    expect(written.response?.status).toBe(204);

    const read = await member.help.detailHelpPage({ path, throwOnError: true });
    expect(read.data.content).toBe(content);
    expect(read.data.screenshots.map(({ id }) => id)).toContain(screenshot!.id);
    expect(read.data.updatedBy?.id).toBe(admin['@user']!.id);
  });

  test('should set aside the screenshots a help page no longer embeds', async ({ admin, expect, member, sql }) => {
    const path = { page: 'MEMBRE' as const };
    const included = await admin.help.includeFilesInHelpPageContent({
      body: { files: [makeFile({ name: 'a.png', type: 'image/png' }), makeFile({ name: 'b.png', type: 'image/png' })] },
      path,
      throwOnError: true,
    });
    const [kept, removed] = included.data.items;

    const content = `<p>Étapes</p><img data-file-id="${kept!.id}" src="${kept!.url}">`;
    await admin.help.writeHelpPageContent({ body: { content }, path, throwOnError: true });
    const read = await member.help.detailHelpPage({ path, throwOnError: true });
    expect(read.data.screenshots.map(({ id }) => id)).toEqual([kept!.id]);
    expect(await isStored(sql, removed!.id)).toBe(true);

    const restored = `${content}<img data-file-id="${removed!.id}" src="${removed!.url}">`;
    await admin.help.writeHelpPageContent({ body: { content: restored }, path, throwOnError: true });
    const reread = await member.help.detailHelpPage({ path, throwOnError: true });
    expect(reread.data.screenshots.map(({ id }) => id).sort()).toEqual([kept!.id, removed!.id].sort());
  });

  test('should let an admin embed a video that its readers play by ranges of bytes', async ({ admin, expect }) => {
    const path = { page: 'SECRETARIAT_GENERAL' as const };
    const video = makeFile({ name: 'demo.mp4', size: 64, type: 'video/mp4' });

    const included = await admin.help.includeFilesInHelpPageContent({
      body: { files: [video] },
      path,
      throwOnError: true,
    });
    const [embedded] = included.data.items;
    expect(embedded?.type).toBe('video/mp4');

    const content =
      `<p>En vidéo</p><video controls="" preload="metadata" src="${embedded!.url}" ` +
      `data-file-id="${embedded!.id}" data-file-name="demo.mp4"></video>`;
    await admin.help.writeHelpPageContent({ body: { content }, path, throwOnError: true });

    const read = await admin.help.detailHelpPage({ path, throwOnError: true });
    expect(read.data.content).toBe(content);
    const fileUrlId = new URL(read.data.screenshots[0]!.url).pathname.split('/').at(-1)!;

    const { data, response } = await admin.files.getFileByFileUrl({
      headers: { Range: 'bytes=0-3' },
      parseAs: 'arrayBuffer',
      path: { fileUrlId },
      throwOnError: true,
    });
    expect(response.status).toBe(206);
    expect(response.headers.get('accept-ranges')).toBe('bytes');
    expect(response.headers.get('content-range')).toBe(`bytes 0-3/${video.size}`);
    expect((data as ArrayBuffer).byteLength).toBe(4);
  });
});

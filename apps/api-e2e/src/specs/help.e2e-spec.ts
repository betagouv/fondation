import { test } from '../fixtures.ts';
import { makeFile } from '../utils/files.ts';
import { isStored } from '../utils/screenshots.ts';

test.describe('Help E2E', () => {
  test('should let an admin write a help page that every user reads with its screenshots', async ({
    admin,
    expect,
    member,
    sql,
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

    // a screenshot removed from the text leaves with the next save and comes back with the text that embeds it
    const second = await admin.help.includeFilesInHelpPageContent({
      body: { files: [makeFile({ name: 'autre.png', type: 'image/png' })] },
      path,
      throwOnError: true,
    });
    const [other] = second.data.items;
    await admin.help.writeHelpPageContent({ body: { content }, path, throwOnError: true });
    const reread = await member.help.detailHelpPage({ path, throwOnError: true });
    expect(reread.data.screenshots.map(({ id }) => id)).toEqual([screenshot!.id]);
    expect(await isStored(sql, other!.id)).toBe(true);

    const restored = `${content}<img data-file-id="${other!.id}" src="${other!.url}">`;
    await admin.help.writeHelpPageContent({ body: { content: restored }, path, throwOnError: true });
    const rereadAgain = await member.help.detailHelpPage({ path, throwOnError: true });
    expect(rereadAgain.data.screenshots.map(({ id }) => id).sort()).toEqual([screenshot!.id, other!.id].sort());
  });
});

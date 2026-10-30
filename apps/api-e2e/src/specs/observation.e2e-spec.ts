import type { LolfiArchiveContent } from 'lolfi';

import { test } from '../fixtures.ts';
import { makeFile } from '../utils/files.ts';
import { observationForm } from '../utils/observation.ts';
import * as seed from '../utils/seed.ts';

const SESSION: LolfiArchiveContent['sessions'][number] = {
  candidates: [
    {
      firstName: 'BLANCHE',
      lastName: 'CORVISART',
      position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  LYON'] },
      targetPosition: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  REIMS'] },
    },
    {
      firstName: 'LUCIEN',
      lastName: 'DAUBENTON',
      position: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  AMIENS'] },
      targetPosition: { function: seed.functions.PR, grade: 'G3', jurisdiction: seed.jurisdictions['CA  GRENOBLE'] },
    },
  ],
  createdAt: '22/04/2026',
  name: 'Transparence annuelle',
};

function pdf(name: string) {
  return makeFile({ name, type: 'application/pdf' });
}

test.describe('Observation', () => {
  test('should edit an observation, its files and the files it links from another observation', async ({
    agent,
    expect,
    sessions,
  }) => {
    const session = await sessions.createOne(SESSION);
    const [observant, otherObservant] = session.files.map(({ magistratId }) => magistratId);
    const path = { nominationFileId: session.files[0]!.id, sessionId: session.id };

    const create = async (magistratId: string, file: File) => {
      const { data } = await agent.observations.createObservation({
        body: { files: [file], form: observationForm({ dateReception: '2026-05-02', magistratId }) },
        path,
        throwOnError: true,
      });
      return data.id;
    };
    const linkedId = await create(observant!, pdf('courrier.pdf'));
    const editedId = await create(otherObservant!, pdf('note.pdf'));

    const listed = async () => {
      const { data } = await agent.observations.listObservations({ path, throwOnError: true });
      return new Map(data.observations.map((observation) => [observation.id, observation]));
    };
    const before = await listed();
    const [linkedFile] = before.get(linkedId)!.files;
    const [detachedFile] = before.get(editedId)!.files;

    const edited = await agent.observations.updateObservation({
      body: {
        files: [pdf('annexe.pdf')],
        form: observationForm({
          dateReception: '2026-05-03',
          description: 'Observation complétée',
          detachFileIds: [detachedFile!.id],
          linkedObservationsAttachments: [{ fileId: linkedFile!.id, observationId: linkedId }],
          magistratId: otherObservant!,
        }),
      },
      path: { ...path, observationId: editedId },
    });
    expect(edited.response?.status).toBe(204);

    const after = await listed();
    const observation = after.get(editedId)!;
    expect(observation).toMatchObject({
      dateReception: '2026-05-03T00:00:00.000Z',
      description: 'Observation complétée',
    });
    expect(observation.files.map(({ name }) => name).toSorted()).toEqual(['annexe.pdf', 'courrier.pdf']);
    expect(after.get(linkedId)!.files.map(({ id }) => id)).toEqual([linkedFile!.id]);

    // a linked file is a copy of the original, served under its own id
    const copy = observation.files.find(({ name }) => name === 'courrier.pdf')!;
    expect(copy.id).not.toBe(linkedFile!.id);
    const url = await agent.observations.getObservationFileUrl({
      path: { ...path, fileId: copy.id, observationId: editedId },
    });
    expect(url.data).toEqual({ id: copy.id, name: 'courrier.pdf', url: expect.any(String) });

    const taken = await agent.observations.updateObservation({
      body: { form: observationForm({ dateReception: '2026-05-03', magistratId: observant! }) },
      path: { ...path, observationId: editedId },
    });
    expect(taken.response?.status).toBe(409);
  });

  test('should detach a file from an observation without touching the files of another one', async ({
    agent,
    expect,
    sessions,
  }) => {
    const session = await sessions.createOne(SESSION);
    const magistratId = session.files[1]!.magistratId;
    const [kept, edited] = session.files.map(({ id }) => ({ nominationFileId: id, sessionId: session.id }));

    const observe = async (path: { nominationFileId: string; sessionId: string }, name: string) => {
      const { data: created } = await agent.observations.createObservation({
        body: { files: [pdf(name)], form: observationForm({ dateReception: '2026-05-02', magistratId }) },
        path,
        throwOnError: true,
      });
      const { data } = await agent.observations.listObservations({ path, throwOnError: true });
      return { files: data.observations[0]!.files.map(({ id }) => id), id: created.id };
    };
    const keptObservation = await observe(kept!, 'courrier.pdf');
    const editedObservation = await observe(edited!, 'note.pdf');

    const detachment = await agent.observations.updateObservation({
      body: {
        form: observationForm({
          dateReception: '2026-05-02',
          detachFileIds: [...keptObservation.files, ...editedObservation.files],
          magistratId,
        }),
      },
      path: { ...edited!, observationId: editedObservation.id },
    });
    expect(detachment.response?.status).toBe(204);

    const { data: detached } = await agent.observations.listObservations({ path: edited!, throwOnError: true });
    expect(detached.observations[0]!.files).toEqual([]);
    const { data } = await agent.observations.listObservations({ path: kept!, throwOnError: true });
    expect(data.observations[0]!.files.map(({ id }) => id)).toEqual(keptObservation.files);
  });

  test('should keep the comment of a reporter on an observation to its author', async ({
    agent,
    expect,
    logIn,
    member,
    sessions,
  }) => {
    const otherReporter = await logIn('MEMBRE_COMMUN');
    const session = await sessions.createOne(SESSION, { reporters: [member['@user']!, otherReporter['@user']!] });
    const path = { nominationFileId: session.files[0]!.id, sessionId: session.id };
    const { data } = await agent.observations.createObservation({
      body: { form: observationForm({ dateReception: '2026-05-02', magistratId: session.files[1]!.magistratId }) },
      path,
      throwOnError: true,
    });
    const observationPath = { ...path, observationId: data.id };

    const written = await member.observations.writeMemberComment({
      body: { comment: '<p>À rapprocher du dossier de 2024<img src="x" onerror="alert(1)"></p>' },
      path: observationPath,
    });
    expect(written.response?.status).toBe(204);
    const attached = await member.observations.attachMemberCommentScreenshots({
      body: { files: [makeFile({ name: 'capture.png', type: 'image/png' })] },
      path: observationPath,
    });
    expect(attached.response?.status).toBe(200);

    const read = await member.observations.getObservationDetails({ path: observationPath });
    // the screenshots land on the comment already written, without wiping it nor its sanitizing
    expect(read.data!.memberComment).toEqual({
      comment: '<p>À rapprocher du dossier de 2024<img></p>',
      screenshots: [expect.objectContaining({ name: 'capture.png', url: expect.any(String) })],
    });

    const readByOther = await otherReporter.observations.getObservationDetails({ path: observationPath });
    expect(readByOther.data!.memberComment).toBeNull();
  });

  test('should set aside the screenshots an observation comment no longer embeds', async ({
    agent,
    expect,
    member,
    sessions,
  }) => {
    const session = await sessions.createOne(SESSION, { reporters: [member['@user']!] });
    const path = { nominationFileId: session.files[0]!.id, sessionId: session.id };
    const { data } = await agent.observations.createObservation({
      body: { form: observationForm({ dateReception: '2026-05-02', magistratId: session.files[1]!.magistratId }) },
      path,
      throwOnError: true,
    });
    const observationPath = { ...path, observationId: data.id };
    const attached = await member.observations.attachMemberCommentScreenshots({
      body: { files: [makeFile({ name: 'a.png', type: 'image/png' }), makeFile({ name: 'b.png', type: 'image/png' })] },
      path: observationPath,
      throwOnError: true,
    });
    const [kept, removed] = attached.data.items;

    const comment = `<p>Avis</p><img data-file-id="${kept!.id}" src="${kept!.url}">`;
    await member.observations.writeMemberComment({ body: { comment }, path: observationPath, throwOnError: true });
    const read = await member.observations.getObservationDetails({ path: observationPath, throwOnError: true });
    expect(read.data.memberComment!.screenshots.map(({ id }) => id)).toEqual([kept!.id]);

    const restored = `${comment}<img data-file-id="${removed!.id}" src="${removed!.url}">`;
    await member.observations.writeMemberComment({
      body: { comment: restored },
      path: observationPath,
      throwOnError: true,
    });
    const reread = await member.observations.getObservationDetails({ path: observationPath, throwOnError: true });
    expect(reread.data.memberComment!.screenshots.map(({ id }) => id).sort()).toEqual([kept!.id, removed!.id].sort());
  });

  test('should not let a reporter comment an observation of another nomination file', async ({
    agent,
    expect,
    member,
    sessions,
  }) => {
    const session = await sessions.createOne(SESSION);
    const [reported, other] = session.files;
    await agent.sessions.affectReporters({
      body: { items: [{ nominationFileId: reported!.id, reporterIds: [member['@user']!.id] }] },
      path: { sessionId: session.id },
      throwOnError: true,
    });
    await agent.sessions.publishNominationSessionAffectationsVersion({
      path: { sessionId: session.id },
      throwOnError: true,
    });
    const { data } = await agent.observations.createObservation({
      body: { form: observationForm({ dateReception: '2026-05-02', magistratId: reported!.magistratId }) },
      path: { nominationFileId: other!.id, sessionId: session.id },
      throwOnError: true,
    });

    const written = await member.observations.writeMemberComment({
      body: { comment: '<p>Hors de mon dossier</p>' },
      path: { nominationFileId: reported!.id, observationId: data.id, sessionId: session.id },
    });
    expect(written.response?.status).toBe(404);
  });

  test('should only serve the file of an observation under its own nomination file', async ({
    agent,
    expect,
    sessions,
  }) => {
    const session = await sessions.createOne(SESSION);
    const [observed, other] = session.files.map(({ id }) => ({ nominationFileId: id, sessionId: session.id }));
    const { data } = await agent.observations.createObservation({
      body: {
        files: [pdf('courrier.pdf')],
        form: observationForm({ dateReception: '2026-05-02', magistratId: session.files[1]!.magistratId }),
      },
      path: observed!,
      throwOnError: true,
    });
    const { data: listed } = await agent.observations.listObservations({ path: observed!, throwOnError: true });
    const fileId = listed.observations[0]!.files[0]!.id;

    const elsewhere = await agent.observations.getObservationFileUrl({
      path: { ...other!, fileId, observationId: data.id },
    });
    expect(elsewhere.response?.status).toBe(404);
  });

  test('should not serve the observations of a session to a member of another formation', async ({
    agent,
    expect,
    logIn,
    sessions,
  }) => {
    const session = await sessions.createOne(SESSION);
    const path = { nominationFileId: session.files[0]!.id, sessionId: session.id };
    const { data } = await agent.observations.createObservation({
      body: {
        files: [pdf('courrier.pdf')],
        form: observationForm({ dateReception: '2026-05-02', magistratId: session.files[1]!.magistratId }),
      },
      path,
      throwOnError: true,
    });
    const { data: listed } = await agent.observations.listObservations({ path, throwOnError: true });
    const observationPath = { ...path, observationId: data.id };
    const { data: detailed } = await agent.sessions.detailsNominationSession({
      path: { sessionId: session.id },
      throwOnError: true,
    });

    const outsider = await logIn(detailed.formation === 'PARQUET' ? 'MEMBRE_DU_SIEGE' : 'MEMBRE_DU_PARQUET');
    const hidden = await Promise.all([
      outsider.observations.listObservations({ path }),
      outsider.observations.getObservationDetails({ path: observationPath }),
      outsider.observations.getObservationFileUrl({
        path: { ...observationPath, fileId: listed.observations[0]!.files[0]!.id },
      }),
    ]);
    expect(hidden.map(({ response }) => response?.status)).toEqual([404, 404, 404]);
  });
});

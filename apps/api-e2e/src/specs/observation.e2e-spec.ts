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
      body: { comment: 'À rapprocher du dossier de 2024' },
      path: observationPath,
    });
    expect(written.response?.status).toBe(204);
    const attached = await member.observations.attachMemberCommentScreenshots({
      body: { files: [makeFile({ name: 'capture.png', type: 'image/png' })] },
      path: observationPath,
    });
    expect(attached.response?.status).toBe(200);

    const read = await member.observations.getObservationDetails({ path: observationPath });
    // the screenshots land on the comment already written, without wiping it
    expect(read.data!.memberComment).toEqual({
      comment: 'À rapprocher du dossier de 2024',
      screenshots: [expect.objectContaining({ name: 'capture.png', url: expect.any(String) })],
    });

    const readByOther = await otherReporter.observations.getObservationDetails({ path: observationPath });
    expect(readByOther.data!.memberComment).toBeNull();
  });
});

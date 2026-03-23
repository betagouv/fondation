import { randomUUID } from 'crypto';

import { Agenda, AgendaCreated } from './agenda';

describe('Agenda', () => {
  it('creates an agenda with an AgendaCreated event', () => {
    const sessionId = randomUUID();
    const authorId = randomUUID();
    const nominationFileIds = [randomUUID(), randomUUID()];

    const agenda = Agenda.create({
      sessionId,
      authorId,
      nominationFileIds,
    });

    expect(agenda.messages).toHaveLength(1);
    expect(agenda.messages[0]).toBeInstanceOf(AgendaCreated);

    expect(agenda.messages).toContainEqual(
      new AgendaCreated(
        expect.any(String),
        sessionId,
        authorId,
        nominationFileIds,
      ),
    );
  });
});

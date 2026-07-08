import { type LolfiData } from 'lolfi';
import supertest from 'supertest';
export declare function createSession(options: {
    cookie: string;
    session: LolfiData['sessions'][number];
    http: ReturnType<typeof supertest.agent>;
}): Promise<{
    id: string;
}>;

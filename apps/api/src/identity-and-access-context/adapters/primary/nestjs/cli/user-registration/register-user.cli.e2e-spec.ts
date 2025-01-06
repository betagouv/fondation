import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema/user-pm';
import { Role } from 'src/identity-and-access-context/business-logic/models/role';
import { RegisterUserCommand } from 'src/identity-and-access-context/business-logic/use-cases/user-registration/register-user.use-case';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { clearDB } from 'test/docker-postgresql-manager';

type UserJson = Omit<RegisterUserCommand, 'password'>;

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'users-'));
const usersFilePath = path.join(tempDir, 'users.json');
const usersJson: UserJson[] = [
  {
    email: 'user1@example.fr',
    role: Role.MEMBRE_DU_SIEGE,
    firstName: 'John',
    lastName: 'Doe',
  },
  {
    email: 'user2@example.fr',
    role: Role.MEMBRE_DU_SIEGE,
    firstName: 'Jane',
    lastName: 'Doe',
  },
];

describe('User Registration (CLI)', () => {
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);

    fs.writeFileSync(usersFilePath, JSON.stringify(usersJson, null, 2));
  });

  afterEach(() => {
    fs.unlinkSync(usersFilePath);
    fs.rmSync(tempDir, { recursive: true });
  });
  afterAll(() => db.$client.end());

  it('registers users from a JSON file', async () => {
    const env = {
      ...process.env,
      DATABASE_PORT: drizzleConfigForTest.port!.toString(),
      DISABLE_PASSWORD_PROMPT: 'true',
    };

    execSync(`npm run cli:register-users -- --from-json ${usersFilePath}`, {
      stdio: 'inherit',
      env,
    });
    await expectRegisteredUser(...usersJson);
  }, 20000);

  const expectRegisteredUser = async (...commands: UserJson[]) => {
    const registeredUsers = await db.select().from(users).execute();

    expect(registeredUsers).toHaveLength(commands.length);

    for (const user of registeredUsers) {
      expect(user).toEqual({
        id: expect.any(String),
        ...commands.find((c) => c.email === user.email),
        password: expect.any(String),
        createdAt: expect.any(Date),
      });
    }
  };
});

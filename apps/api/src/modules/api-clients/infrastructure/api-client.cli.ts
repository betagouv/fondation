import { Module } from '@nestjs/common';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import z from 'zod';

import { ApiClientsModule } from '../api-clients.module';
import { ApiClientsService } from '../api-clients.service';
import { API_SCOPES, ApiScope, ROTATION_DAYS } from '../domain/api-client';

type RegisterApiClientOptions = { ip: string[]; name: string; scope?: ApiScope[] };

@SubCommand({ name: 'register' })
export class RegisterApiClientCliCommand extends CommandRunner {
  constructor(private readonly apiClients: ApiClientsService) {
    super();
  }

  async run(_inputs: string[], options: RegisterApiClientOptions): Promise<void> {
    const { id, secret } = await this.apiClients.register({
      allowedIps: options.ip,
      name: options.name,
      scopes: options.scope ?? [],
    });

    // The only time the secret is shown: Fondation keeps its hash
    console.log(`client_id: ${id}\nclient_secret: ${secret}`);
  }

  @Option({ flags: '-n, --name <name>', name: 'name', required: true })
  parseName(name: string): string {
    return z.string().trim().min(1).parse(name);
  }

  @Option({
    // without any, the client would be refused from everywhere and its secret shown for nothing
    description: 'an IP the client may call from, repeated for each one',
    flags: '-i, --ip <ip>',
    name: 'ip',
    required: true,
  })
  parseIp(ip: string, ips: string[] = []): string[] {
    return [...ips, z.union([z.ipv4(), z.ipv6()]).parse(ip)];
  }

  @Option({
    choices: [...API_SCOPES],
    description: 'a route the client may call, repeated for each one',
    flags: '-s, --scope <scope>',
    name: 'scope',
  })
  parseScope(scope: string, scopes: ApiScope[] = []): ApiScope[] {
    return [...scopes, z.enum(API_SCOPES).parse(scope)];
  }
}

@SubCommand({ name: 'rotate-secret' })
export class RotateApiClientSecretCliCommand extends CommandRunner {
  constructor(private readonly apiClients: ApiClientsService) {
    super();
  }

  async run(_inputs: string[], options: { client: string; days?: number }): Promise<void> {
    const { previousValidUntil, secret } = await this.apiClients.rotateSecret({
      clientId: options.client,
      days: options.days,
    });

    console.log(
      `client_secret: ${secret}\nThe replaced secret stays valid until ${previousValidUntil.toISOString()}`,
    );
  }

  @Option({ flags: '-c, --client <id>', name: 'client', required: true })
  parseClient(id: string): string {
    return z.uuid().parse(id);
  }

  @Option({
    description: `how long the replaced secret stays valid, ${ROTATION_DAYS.default} days by default and ${ROTATION_DAYS.max} at most`,
    flags: '-d, --days <days>',
    name: 'days',
  })
  parseDays(days: string): number {
    // the bound is the domain's, ApiClientNotRotatable('days') tells it
    return z.coerce.number().int().parse(days);
  }
}

@SubCommand({
  description:
    'drops the replaced secret and deletes every token of the client, a rotation running or not: the partner gets a 401 on its next call and asks for a new token with its current secret. Without a rotation, it revokes the tokens at once, not the client',
  name: 'end-rotation',
})
export class EndApiClientSecretRotationCliCommand extends CommandRunner {
  constructor(private readonly apiClients: ApiClientsService) {
    super();
  }

  async run(_inputs: string[], options: { client: string }): Promise<void> {
    await this.apiClients.endSecretRotation({ clientId: options.client });
  }

  @Option({ flags: '-c, --client <id>', name: 'client', required: true })
  parseClient(id: string): string {
    return z.uuid().parse(id);
  }
}

@Command({
  name: 'api-client',
  subCommands: [
    EndApiClientSecretRotationCliCommand,
    RegisterApiClientCliCommand,
    RotateApiClientSecretCliCommand,
  ],
})
export class ApiClientCliCommand extends CommandRunner {
  async run(): Promise<void> {}
}

@Module({
  imports: [ApiClientsModule],
  providers: [
    ApiClientCliCommand,
    EndApiClientSecretRotationCliCommand,
    RegisterApiClientCliCommand,
    RotateApiClientSecretCliCommand,
  ],
})
export class ApiClientsCliModule {}

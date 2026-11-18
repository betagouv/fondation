import { Module } from '@nestjs/common';
import { Command, CommandRunner, Option, SubCommand } from 'nest-commander';
import z from 'zod';

import { ApiClientsModule } from '../api-clients.module';
import { ApiClientsService } from '../api-clients.service';
import { API_SCOPES, ApiScope } from '../domain/api-client';

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

@Command({ name: 'api-client', subCommands: [RegisterApiClientCliCommand] })
export class ApiClientCliCommand extends CommandRunner {
  async run(): Promise<void> {}
}

@Module({
  imports: [ApiClientsModule],
  providers: [ApiClientCliCommand, RegisterApiClientCliCommand],
})
export class ApiClientsCliModule {}

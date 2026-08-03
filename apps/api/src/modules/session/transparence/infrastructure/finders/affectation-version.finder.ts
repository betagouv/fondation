import assert from 'node:assert';

import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';
import { StatutAffectationEnum } from 'src/modules/session/shared/types/statut-affectation.enum';
import { prismaStatutAffectationEnumToStatutAffectationEnum } from 'src/modules/shared/mappers/statut-affectation.mapper';

@Injectable()
export class AffectationVersionFinder {
  constructor(private readonly db: Db) {}

  /** @warning does not check that the session exists */
  @Transactional(Propagation.Mandatory)
  async last(query: { sessionId: string }): Promise<OptionalAffectationVersion> {
    const { _max } = await this.db.tx.affectationVersion.aggregate({
      where: { sessionId: query.sessionId },
      _max: { version: true },
    });

    return this.version({
      version: _max.version,
      sessionId: query.sessionId,
    });
  }

  /** @warning does not check that the session exists */
  @Transactional(Propagation.Mandatory)
  async lastPublished(query: { sessionId: string }) {
    const { _max } = await this.db.tx.affectationVersion.aggregate({
      where: { sessionId: query.sessionId, statut: 'PUBLIEE' },
      _max: { version: true },
    });

    return this.version({
      version: _max.version,
      sessionId: query.sessionId,
    });
  }

  private async version(props: {
    sessionId: string;
    version: number | null;
  }): Promise<OptionalAffectationVersion> {
    const version = await this.db.tx.affectationVersion.findFirst({
      select: {
        id: true,
        version: true,
        statut: true,
        datePublication: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      where: props.version
        ? { version: props.version, sessionId: props.sessionId }
        : { sessionId: props.sessionId },
    });

    if (!version) return OptionalAffectationVersion.none();

    return OptionalAffectationVersion.some({
      '@type': 'fr.csm.fondation.affectations.version.some',
      id: version.id,
      version: version.version,
      author: version.user ?? null,
      publicationDate: version.datePublication?.toISOString() ?? null,
      status: prismaStatutAffectationEnumToStatutAffectationEnum(version.statut),
    });
  }

  @Transactional()
  async findReporters(query: {
    nominationFileId: string;
    sessionId: string;
  }): Promise<{ id: string; firstName: string; lastName: string }[]> {
    const version = await this.lastPublished({
      sessionId: query.sessionId,
    });

    if (version.isNone()) return [];

    const reporters = await this.db.tx.nominationFileToReporter.findMany({
      select: { user: { select: { id: true, firstName: true, lastName: true } } },
      where: {
        versionId: version.id,
        nominationFileId: query.nominationFileId,
      },
    });

    return reporters.map(({ user }) => user);
  }
}

export class NoneAffectationVersion extends createZodDto(
  z.object({
    '@type': z.literal('fr.csm.fondation.affectations.version.none'),
    version: z.literal(0),
  }),
) {}

export class SomeAffectationVersion extends createZodDto(
  z.object({
    '@type': z.literal('fr.csm.fondation.affectations.version.some'),
    id: z.uuid(),
    status: z.enum(StatutAffectationEnum),
    version: z.number().int().gte(1),
    publicationDate: z.iso.datetime().nullable(),
    author: z.object({ id: z.string(), firstName: z.string(), lastName: z.string() }).nullable(),
  }),
) {}

export type FoundAffectationVersion = SomeAffectationVersion | NoneAffectationVersion;

export class OptionalAffectationVersion<V extends FoundAffectationVersion = FoundAffectationVersion> {
  private constructor(private readonly value: V) {}

  static some(someVersion: SomeAffectationVersion): OptionalAffectationVersion<SomeAffectationVersion> {
    return new OptionalAffectationVersion(someVersion);
  }

  static none(): OptionalAffectationVersion<NoneAffectationVersion> {
    return new OptionalAffectationVersion({
      '@type': 'fr.csm.fondation.affectations.version.none',
      version: 0,
    });
  }

  isNone(): this is this & OptionalAffectationVersion<NoneAffectationVersion> {
    return this.value['@type'] === 'fr.csm.fondation.affectations.version.none';
  }

  get(): FoundAffectationVersion {
    return this.value;
  }

  getNullable(): SomeAffectationVersion | null {
    return this.map((v) => v);
  }

  get optionalId(): SomeAffectationVersion['id'] | undefined {
    return this.map({ some: ({ id }) => id, none: () => undefined });
  }

  /** @throws */
  get id(): SomeAffectationVersion['id'] {
    const id = this.optionalId;
    assert.ok(id !== undefined, `OptionalAffectationVersion did not receive any version`);

    return id;
  }

  map<U>(someMapper: (version: SomeAffectationVersion) => U): U | null;
  map<U, T>(predicates: {
    some: (version: SomeAffectationVersion) => U;
    none: (version: NoneAffectationVersion) => T;
  }): U | T;

  map<U, T = null>(
    mappers:
      | ((version: SomeAffectationVersion) => U)
      | {
          some: (version: SomeAffectationVersion) => U;
          none: (version: NoneAffectationVersion) => T;
        },
  ): U | T {
    if (this.value['@type'] === 'fr.csm.fondation.affectations.version.none') {
      if ('none' in mappers) return mappers.none(this.value);
      return null as T;
    }

    if (typeof mappers === 'function') return mappers(this.value);
    return mappers.some(this.value);
  }
}

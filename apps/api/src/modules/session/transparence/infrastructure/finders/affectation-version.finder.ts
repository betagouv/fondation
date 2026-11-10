import assert from 'node:assert';

import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { findPublishedAndLatestReportersRawQuery } from '../../../../../generated/prisma/sql';
import { Db } from '../../../../framework/database';
import { prismaStatutAffectationEnumToStatutAffectationEnum } from '../../../../shared/mappers/statut-affectation.mapper';
import type { PublicationStatus } from '../../../../shared/publication-status.enum';
import type { StatutAffectationEnum } from '../../../../shared/statut-affectation.enum';
import { PublishableAffectations } from '../../domain/affectations-publication';
import type { FileReporters } from '../../domain/member-recusal';
import { publicationStatusOf } from '../../domain/publication';

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

  /** the callers already read both versions: only their reporters are left to load */
  @Transactional(Propagation.Mandatory)
  async publicationStatus(query: {
    draftVersionId: string | null;
    publishedVersionId: string | null;
  }): Promise<PublicationStatus> {
    const published = query.publishedVersionId
      ? await this.affectations({ versionId: query.publishedVersionId })
      : null;
    const current = query.draftVersionId
      ? await this.affectations({ versionId: query.draftVersionId })
      : (published ?? PublishableAffectations.from([]));

    return publicationStatusOf({ current, published });
  }

  private async affectations(query: { versionId: string }): Promise<PublishableAffectations> {
    const affectations = await this.db.tx.nominationFileToReporter.findMany({
      select: { nominationFileId: true, userId: true } satisfies Prisma.NominationFileToReporterSelect,
      where: { versionId: query.versionId },
    });

    return PublishableAffectations.from(
      affectations.map(({ nominationFileId, userId }) => ({ nominationFileId, reporterId: userId })),
    );
  }

  private async version(props: {
    sessionId: string;
    version: number | null;
  }): Promise<OptionalAffectationVersion> {
    if (props.version === null) return OptionalAffectationVersion.none();

    const version = await this.db.tx.affectationVersion.findFirst({
      select: {
        id: true,
        version: true,
        statut: true,
        datePublication: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      } satisfies Prisma.AffectationVersionSelect,
      where: { version: props.version, sessionId: props.sessionId },
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

  /** the reporters of each file in the last published version of its session */
  @Transactional()
  async findPublishedReporters(query: {
    nominationFileIds: readonly string[];
  }): Promise<Map<string, { firstName: string; id: string; lastName: string }[]>> {
    const versions = await this.db.tx.affectationVersion.findMany({
      select: { id: true, sessionId: true, version: true } satisfies Prisma.AffectationVersionSelect,
      where: {
        session: { dossierDeNominations: { some: { id: { in: [...query.nominationFileIds] } } } },
        statut: 'PUBLIEE',
      },
    });
    const lastBySessionId = new Map<string, { id: string; version: number }>();
    for (const version of versions) {
      const last = lastBySessionId.get(version.sessionId);
      if (!last || last.version < version.version) lastBySessionId.set(version.sessionId, version);
    }
    if (lastBySessionId.size === 0) return new Map();

    const reporters = await this.db.tx.nominationFileToReporter.findMany({
      select: {
        nominationFileId: true,
        user: { select: { firstName: true, id: true, lastName: true } },
      } satisfies Prisma.NominationFileToReporterSelect,
      where: {
        nominationFileId: { in: [...query.nominationFileIds] },
        versionId: { in: [...lastBySessionId.values()].map(({ id }) => id) },
      },
    });

    const byNominationFileId = new Map<string, { firstName: string; id: string; lastName: string }[]>();
    for (const { nominationFileId, user } of reporters) {
      const list = byNominationFileId.get(nominationFileId) ?? [];
      list.push(user);
      byNominationFileId.set(nominationFileId, list);
    }

    return byNominationFileId;
  }

  /** the reporters of each file in the last published version and in the latest version of its session */
  @Transactional()
  async findPublishedAndLatestReporters(query: {
    nominationFileIds: readonly string[];
  }): Promise<Map<string, FileReporters>> {
    if (query.nominationFileIds.length === 0) return new Map();

    const rows = await this.db.tx.$queryRawTyped(
      findPublishedAndLatestReportersRawQuery(query.nominationFileIds as string[]),
    );

    const byNominationFileId = new Map<string, { latestIds: Set<string>; publishedIds: Set<string> }>();
    for (const { isLatest, isPublished, nominationFileId, userId } of rows) {
      const reporters = byNominationFileId.get(nominationFileId) ?? {
        latestIds: new Set(),
        publishedIds: new Set(),
      };
      if (isLatest) reporters.latestIds.add(userId);
      if (isPublished) reporters.publishedIds.add(userId);
      byNominationFileId.set(nominationFileId, reporters);
    }

    return byNominationFileId;
  }
}

export type NoneAffectationVersion = {
  '@type': 'fr.csm.fondation.affectations.version.none';
  version: 0;
};

export type SomeAffectationVersion = {
  '@type': 'fr.csm.fondation.affectations.version.some';
  author: { firstName: string; id: string; lastName: string } | null;
  id: string;
  publicationDate: string | null;
  status: StatutAffectationEnum;
  version: number;
};

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

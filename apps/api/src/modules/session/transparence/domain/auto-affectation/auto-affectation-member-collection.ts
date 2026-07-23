import { Logger } from '@nestjs/common';

import { AffectableMember, AutoAffectationMember } from './auto-affectation-member';
import { AutoAffectationNominationFile } from './auto-affectation-nomination-file';

/** sorted list of AutoAffectationMember */
export class AutoAffectationMemberCollection {
  private readonly logger = new Logger(AutoAffectationMemberCollection.name);

  constructor(readonly members: readonly AutoAffectationMember[]) {
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'test' || process.env.CI) {
      this.logger.localInstance.setLogLevels?.([]);
    }
  }

  affect(
    gradedFiles: readonly AutoAffectationNominationFile[],
  ): { nominationFileId: string; reporterIds: string[] }[] {
    this.logger.debug(`Got ${this.members.length} members in formation ${this.members[0]?.formation}`);

    const members = this.prepareMembers(gradedFiles);

    const files = gradedFiles.filter((file) => members.some((member) => member.canReportOn(file)));
    if (gradedFiles.length !== files.length) {
      this.logger.warn(`Excluded ${gradedFiles.length - files.length} files`);
    }

    for (
      let i = 0, attempts = 0;
      i < members.length && files.length > 0 && attempts < 3;
      (i = (i + 1) % members.length) || (++attempts && this.logger.debug(`${attempts}th files pass`))
    ) {
      const member = members[i];
      /* istanbul ignore next */
      if (!member) continue;

      const chunk = files.splice(0, member.take);

      if (member.canReportOn(chunk)) {
        member.affect(chunk);
        continue;
      }

      this.logger.warn(`Jurisdiction exclusion`);
      const otherMembers = ([] as AffectableMember[]).concat(
        members.slice(0, i),
        members.slice(i + 1, members.length),
      );

      const exchanged = otherMembers.find((otherMember) =>
        otherMember.exchangeLastAffectationWith(member, chunk),
      );

      if (!exchanged) {
        files.push(...chunk);
        this.logger.warn(`did not find another member to exchange files with`);
      }
    }

    return members.flatMap((member) => member.affectations);
  }

  private prepareMembers(gradedFiles: readonly AutoAffectationNominationFile[]): readonly AffectableMember[] {
    const builders = this.members
      .toSorted(AutoAffectationMember.fromLeastToMostWorkload)
      .map((member) => member.prepare(Math.floor(gradedFiles.length / this.members.length)));

    let total = builders.reduce((sum, b) => sum + b.take, 0);
    for (let i = 0; total < gradedFiles.length; i = (i + 1) % builders.length) {
      const builder = builders[i];
      if (builder) {
        builder?.increaseTake();
        total += 1;
      }
    }

    return builders.map((b) => b.build());
  }
}

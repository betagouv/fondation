import { Logger } from '@nestjs/common';

import { AutoAffectationMember } from './auto-affectation-member';
import { AutoAffectationMemberCollection } from './auto-affectation-member-collection';
import { AutoAffectationNominationFile } from './auto-affectation-nomination-file';

export class AutoAffectations {
  private readonly logger = new Logger(AutoAffectations.name);

  private constructor(
    private readonly members: AutoAffectationMemberCollection,
    private readonly nominationFiles: IteratorObject<readonly AutoAffectationNominationFile[]>,
  ) {
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'test' || process.env.CI) {
      this.logger.localInstance.setLogLevels?.([]);
    }
  }

  static from(props: {
    files: readonly AutoAffectationNominationFile[];
    members: readonly AutoAffectationMember[];
  }): AutoAffectations {
    return new AutoAffectations(
      new AutoAffectationMemberCollection(props.members),
      AutoAffectationNominationFile.group(props.files),
    );
  }

  distribute(): {
    nominationFileId: string;
    reporterIds: readonly string[];
  }[] {
    const result = this.nominationFiles.flatMap((files) => this.members.affect(files)).toArray();
    this.logger.debug(`${result.length} affectations made`);
    return result;
  }
}

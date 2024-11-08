import { NominationFile } from 'shared-models';
import { InvalidRowValueError } from '../../errors/invalid-row-value.error';
import { NominationFileRead } from '../nomination-file-read';

export class StateTsvNormalizer {
  static normalize(
    state: string,
    rowIndex: number,
  ): NominationFileRead['content']['state'] {
    switch (state) {
      case 'Nouveau':
        return NominationFile.ReportState.NEW;
      case 'Avis restitué':
        return NominationFile.ReportState.OPINION_RETURNED;
      default:
        throw new InvalidRowValueError('state', state, rowIndex);
    }
  }
}

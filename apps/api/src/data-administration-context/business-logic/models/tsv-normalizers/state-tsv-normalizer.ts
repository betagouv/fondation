import { NominationFile } from 'shared-models';
import { InvalidRowValueError } from '../../errors/invalid-row-value.error';
import { NominationFileRead } from '../nomination-file-read';

export class StateTsvNormalizer {
  /**
   * @remark
   * With the introduction of a new Google Sheet import process:
   * - the state column might be removed
   * - or the enum used might change
   */
  static normalize(
    state: string,
    rowIndex: number,
  ): NominationFileRead['content']['state'] {
    switch (state) {
      case 'Nouveau':
        return NominationFile.ReportState.NEW;
      case 'Avis restitué':
        return NominationFile.ReportState.SUPPORTED;
      default:
        throw new InvalidRowValueError('state', state, rowIndex);
    }
  }
}

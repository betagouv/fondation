import { GdsTransparenceNominationFilesModifiedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-nomination-files-modified.event';
import { Règle } from 'src/nominations-context/sessions/business-logic/models/règle';

export class GdsDossierTransparenceModifiéEventRulesTransformer {
  static transform(
    rules: NonNullable<
      GdsTransparenceNominationFilesModifiedEventPayload['nominationFiles'][number]['content']['rules']
    >,
  ): Règle[] {
    return Object.entries(rules).reduce(
      (acc, [group, groupRules]) => [
        ...acc,
        ...Object.entries(groupRules)
          .filter(([, value]) => value !== undefined)
          .map(([name, value]) => Règle.create(group, name, value!)),
      ],
      [] as Règle[],
    );
  }
}

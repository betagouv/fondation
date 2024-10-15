import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { NominationFileReport } from './nomination-file-report';
import { NominationFile, Magistrat, Transparency } from '@/shared-models';

export class ReportBuilder {
  private id: string;
  private biography: string;
  private dueDate: DateOnly | null;
  private name: string;
  private birthDate: DateOnly;
  private state: NominationFile.ReportState;
  private formation: Magistrat.Formation;
  private transparency: Transparency;
  private grade: Magistrat.Grade;
  private targettedPosition: string;
  private comment: string | null;

  constructor() {
    this.id = 'report-id';
    this.name = 'John Doe';
    this.biography = 'Biography';
    this.dueDate = new DateOnly(2030, 1, 1);
    this.birthDate = new DateOnly(1980, 1, 1);
    this.state = NominationFile.ReportState.NEW;
    this.formation = Magistrat.Formation.SIEGE;
    this.transparency = Transparency.MARCH_2025;
    this.grade = Magistrat.Grade.I;
    this.targettedPosition = 'Juge TJ -Marseille';
    this.comment = 'my comment';
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }
  withBiography(biography: string) {
    this.biography = biography;
    return this;
  }
  withDueDate(dueDate: DateOnly | null) {
    this.dueDate = dueDate;
    return this;
  }
  withBirthDate(birthDate: DateOnly) {
    this.birthDate = birthDate;
    return this;
  }
  withComment(comment: string | null) {
    this.comment = comment;
    return this;
  }

  build(): NominationFileReport {
    return {
      id: this.id,
      name: this.name,
      biography: this.biography,
      dueDate: this.dueDate,
      birthDate: this.birthDate,
      state: this.state,
      formation: this.formation,
      transparency: this.transparency,
      grade: this.grade,
      targettedPosition: this.targettedPosition,
      comment: this.comment,
    };
  }
}

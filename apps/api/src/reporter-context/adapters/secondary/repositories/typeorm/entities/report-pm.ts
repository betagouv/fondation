import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateTransformer } from '../../../../../../shared-kernel/adapters/secondary/repositories/typeorm/dateTransformers';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { DateOnly } from '../../../../../../shared-kernel/business-logic/models/date-only';
import { Magistrat, NominationFile, Transparency } from '@/shared-models';

@Entity({ schema: 'reporter_context', name: 'reports' })
export class ReportPm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  biography: string;

  @Column({
    name: 'due_date',
    type: 'date',
    nullable: true,
    transformer: new DateTransformer(),
  })
  dueDate: Date | null;

  @Column()
  name: string;

  @Column({
    name: 'birth_date',
    type: 'date',
    transformer: new DateTransformer(),
  })
  birthDate: Date;

  @Column({
    name: 'state',
    type: 'enum',
    enum: NominationFile.ReportState,
    default: NominationFile.ReportState.NEW,
  })
  state: NominationFile.ReportState;

  @Column({
    name: 'formation',
    type: 'enum',
    enum: Magistrat.Formation,
  })
  formation: Magistrat.Formation;

  @Column({ name: 'transparency', type: 'enum', enum: Transparency })
  transparency: Transparency;

  @Column({ name: 'grade', type: 'enum', enum: Magistrat.Grade })
  grade: Magistrat.Grade;

  @Column({ name: 'targetted_position' })
  targettedPosition: string;

  @Column({ name: 'comments', type: 'text', nullable: true })
  comments: string | null;

  constructor(
    id: string,
    biography: string,
    dueDate: Date | null,
    name: string,
    birthDate: Date,
    state: NominationFile.ReportState,
    formation: Magistrat.Formation,
    transparency: Transparency,
    grade: Magistrat.Grade,
    targettedPosition: string,
    comments: string | null,
  ) {
    this.id = id;
    this.biography = biography;
    this.dueDate = dueDate;
    this.name = name;
    this.birthDate = birthDate;
    this.state = state;
    this.formation = formation;
    this.transparency = transparency;
    this.grade = grade;
    this.targettedPosition = targettedPosition;
    this.comments = comments;
  }

  static fromDomain(report: NominationFileReport): ReportPm {
    return new ReportPm(
      report.id,
      report.biography,
      report.dueDate?.toDate() ?? null,
      report.name,
      report.birthDate.toDate(),
      report.state,
      report.formation,
      report.transparency,
      report.grade,
      report.targettedPosition,
      report.comment,
    );
  }

  toDomain(): NominationFileReport {
    return {
      id: this.id,
      biography: this.biography,
      dueDate: this.dueDate ? DateOnly.fromDate(this.dueDate) : null,
      name: this.name,
      birthDate: DateOnly.fromDate(this.birthDate),
      state: this.state,
      formation: this.formation,
      transparency: this.transparency,
      grade: this.grade,
      targettedPosition: this.targettedPosition,
      comment: this.comments,
    };
  }
}

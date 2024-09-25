import { Position } from '../Position';

export class JudiciaryRoleAndJuridictionDegreeChangeValidator {
  validate(currentPosition: Position, newPosition: Position): boolean {
    return (
      currentPosition.isSameJudiciaryRoleAs(newPosition) ||
      currentPosition.isSameJuridictionDegreeAs(newPosition) ||
      !currentPosition.isSameRessortAs(newPosition)
    );
  }
}

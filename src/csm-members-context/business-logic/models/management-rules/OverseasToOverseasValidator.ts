import { PositionGeography } from '../PositionGeography';

export class OverseasToOverseasValidator {
  validate(
    currentPositionGeography: PositionGeography,
    newPositionGeography: PositionGeography,
  ): boolean {
    if (
      currentPositionGeography.isNotAssigned() ||
      currentPositionGeography.isSecondment()
    )
      return false;

    return !(
      newPositionGeography.isOverseas() && currentPositionGeography.isOverseas()
    );
  }
}

import { currentPositionLabel } from '../utils/magistrat-position.utils';
import { GradeAndPosition } from '@/shared/components/GradeAndPosition';
import type { FoundMagistrat } from '@queries/magistrats.queries';

export function MagistratGradeAndPosition(props: Pick<FoundMagistrat, 'currentPosition' | 'grade'>) {
  const position = currentPositionLabel(props.currentPosition);
  return position ? <GradeAndPosition grade={props.grade} position={position} /> : props.grade;
}

import type { FormationEnum } from '../formation.enum';
import { roleToFormation, type RoleEnum } from '../role.enum';

/** a member of one formation does not read the sessions of the other */
export function canReadSession(session: { formation: FormationEnum }, user: { role: RoleEnum }): boolean {
  const formation = roleToFormation(user.role);
  return !formation || formation === session.formation;
}

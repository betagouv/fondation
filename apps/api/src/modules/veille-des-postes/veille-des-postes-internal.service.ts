import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { PositionVacancyRepository } from './infrastructure/repositories/position-vacancy.repository';

/**
 * what the other modules may ask of the veille des postes. It stays apart from VeilleDesPostesService: its queries
 * reach the sessions that import the LOLFI import, and this circle leaves a class undefined at boot
 */
@Injectable()
export class VeilleDesPostesInternalService {
  constructor(private readonly vacancies: PositionVacancyRepository) {}

  /** called by the LOLFI import, which may have moved the magistrats */
  @Transactional(Propagation.Mandatory)
  async internalDeleteLapsedPositionVacancies(): Promise<number> {
    return this.vacancies.deleteLapsed();
  }
}

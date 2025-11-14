import { Injectable } from '@nestjs/common';

@Injectable()
export class AffectationService {
  autoAffectation(readonly nominationFileIds: readonly string[]) {}
}

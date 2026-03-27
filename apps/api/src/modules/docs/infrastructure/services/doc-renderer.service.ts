import { Injectable } from '@nestjs/common';
import { AgendaRenderer } from './renderers/agenda.renderer';

@Injectable()
export class DocRenderer {
  constructor(readonly agenda: AgendaRenderer) {}
}

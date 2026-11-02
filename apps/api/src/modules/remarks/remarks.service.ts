import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Pagination } from '../framework/pagination';

import { Remark, type RemarkStatus } from './domain/remark';
import { ListRemarksQuery, PaginatedRemarkListItemDto } from './infrastructure/queries/list-remarks.query';
import { RemarkRepository } from './infrastructure/remark.repository';

@Injectable()
export class RemarksService {
  constructor(
    private readonly listRemarksQuery: ListRemarksQuery,
    private readonly remarkRepository: RemarkRepository,
  ) {}

  listRemarks(query: { pagination: Pagination }): Promise<PaginatedRemarkListItemDto> {
    return this.listRemarksQuery.handle(query);
  }

  @Transactional()
  async sendRemark(command: {
    sender: { id: string; impersonatorId: string | null };
    text: string;
    url: string;
  }): Promise<void> {
    await this.remarkRepository.persist(Remark.send(command));
  }

  @Transactional()
  async changeRemarkStatus(command: {
    changedBy: string;
    remarkId: string;
    status: RemarkStatus;
  }): Promise<void> {
    const remark = await this.remarkRepository.find(command);
    remark.changeStatus(command);
    await this.remarkRepository.persist(remark);
  }
}

import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Pagination } from '../framework/pagination';
import { Sortable } from '../framework/sorting';

import { Remark, type RemarkStatus, type RemarkStatusWithComment } from './domain/remark';
import { ListRemarksQuery, ListedRemarksDto } from './infrastructure/queries/list-remarks.query';
import type { ListRemarksQueryDto } from './infrastructure/remark.dto';
import { RemarkRepository } from './infrastructure/remark.repository';

@Injectable()
export class RemarksService {
  constructor(
    private readonly listRemarksQuery: ListRemarksQuery,
    private readonly remarkRepository: RemarkRepository,
  ) {}

  listRemarks(query: {
    pagination: Pagination;
    sorting: Sortable<ListRemarksQueryDto>;
    statuses: readonly RemarkStatus[];
  }): Promise<ListedRemarksDto> {
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
    status: RemarkStatusWithComment;
  }): Promise<void> {
    const remark = await this.remarkRepository.find(command);
    remark.changeStatus(command);
    await this.remarkRepository.persist(remark);
  }
}

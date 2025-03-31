import { DomainRegistry as SharedKernelDomainRegistry } from 'src/shared-kernel/business-logic/models/domain-registry';
import { ReportRuleRepository } from '../gateways/repositories/report-rule.repository';

export class DomainRegistry extends SharedKernelDomainRegistry {
  private static reportRuleRepositoryService: ReportRuleRepository;

  static setReportRuleRepository(service: ReportRuleRepository) {
    DomainRegistry.reportRuleRepositoryService = service;
  }
  static reportRuleRepository(): ReportRuleRepository {
    if (!DomainRegistry.reportRuleRepositoryService) {
      throw new Error('ReportRuleRepository is not set');
    }
    return DomainRegistry.reportRuleRepositoryService;
  }
}

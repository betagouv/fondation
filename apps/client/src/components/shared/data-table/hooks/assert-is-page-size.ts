import { ITEMS_PAR_PAGE } from '@/types/table.types';

const PAGE_SIZES = new Set(ITEMS_PAR_PAGE.map(({ value }) => value));
export function assertIsPageSize(
  pageSize: unknown
): asserts pageSize is (typeof ITEMS_PAR_PAGE)[number]['value'] {
  if (
    import.meta.env.PROD &&
    pageSize !== undefined &&
    pageSize !== null &&
    (!Number.isFinite(pageSize) || !PAGE_SIZES.has(pageSize as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    throw new Error(
      `the page size should be one of (${[...PAGE_SIZES].toString()}). ${JSON.stringify(pageSize)} provided`
    );
  }
}

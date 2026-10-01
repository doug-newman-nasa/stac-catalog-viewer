export function getPaginatedData<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return items.slice(start, end);
}

export function getTotalPages(itemCount: number, pageSize: number): number {
  return Math.ceil(itemCount / pageSize);
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

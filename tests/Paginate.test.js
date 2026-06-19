const { getPaginationParams, buildPagination } = require('../src/utils/Paginate');

describe('Paginate Utility', () => {
  describe('getPaginationParams', () => {
    test('should return default values when query is empty', () => {
      const params = getPaginationParams({});
      expect(params).toEqual({ page: 1, limit: 12, skip: 0 });
    });

    test('should parse custom page and limit strings', () => {
      const params = getPaginationParams({ page: '3', limit: '10' });
      expect(params).toEqual({ page: 3, limit: 10, skip: 20 });
    });

    test('should prevent negative or zero page and limit values', () => {
      const params = getPaginationParams({ page: '-5', limit: '0' });
      expect(params).toEqual({ page: 1, limit: 12, skip: 0 });
    });

    test('should cap limit at 50', () => {
      const params = getPaginationParams({ limit: '100' });
      expect(params.limit).toBe(50);
    });
  });

  describe('buildPagination', () => {
    test('should calculate correct pages and navigation flags', () => {
      const meta = buildPagination(45, 2, 10);
      expect(meta).toEqual({
        total: 45,
        page: 2,
        limit: 10,
        pages: 5,
        hasNext: true,
        hasPrev: true
      });
    });

    test('should report no hasNext when on last page', () => {
      const meta = buildPagination(45, 5, 10);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(true);
    });

    test('should report no hasPrev when on first page', () => {
      const meta = buildPagination(45, 1, 10);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(false);
    });
  });
});

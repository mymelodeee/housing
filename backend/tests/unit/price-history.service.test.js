const {
  buildPriceHistoryResult,
  formatYearMonth,
  formatDateOnly,
  mapEntry,
} = require('../../src/services/price-history.service');

const NOW = new Date('2026-07-06T00:00:00Z');
const DATA_SOURCE = '국토교통부 아파트 실거래가 공개시스템(오픈API)';

describe('services/price-history.service', () => {
  describe('buildPriceHistoryResult', () => {
    it('rows가 빈 배열이면 "실거래 이력 없음"을 반환한다', () => {
      const result = buildPriceHistoryResult({ rows: [], now: NOW });

      expect(result).toEqual({
        lookupPeriodType: '실거래 이력 없음',
        firstTransactionMonth: null,
        entries: [],
      });
    });

    it('최초거래(2000-01-01)가 20년(2006-07-06) 이상 지났으면 최근 20년 데이터만 필터링해 반환한다', () => {
      const rows = [
        { transaction_date: new Date('2000-01-01T00:00:00Z'), transaction_price: 30000 },
        { transaction_date: new Date('2005-12-31T00:00:00Z'), transaction_price: 40000 },
        { transaction_date: new Date('2006-07-06T00:00:00Z'), transaction_price: 45000 },
        { transaction_date: new Date('2010-05-05T00:00:00Z'), transaction_price: 68000 },
        { transaction_date: new Date('2024-11-02T00:00:00Z'), transaction_price: 95000 },
      ];

      const result = buildPriceHistoryResult({ rows, now: NOW });

      expect(result.lookupPeriodType).toBe('최근 20년');
      expect(result.firstTransactionMonth).toBeNull();
      expect(result.entries).toEqual([
        { transactionDate: '2006-07-06', transactionPrice: 45000, dataSource: DATA_SOURCE },
        { transactionDate: '2010-05-05', transactionPrice: 68000, dataSource: DATA_SOURCE },
        { transactionDate: '2024-11-02', transactionPrice: 95000, dataSource: DATA_SOURCE },
      ]);
    });

    it('최초거래가 정확히 20년 전(경계값)이면 "최근 20년" 분기를 탄다', () => {
      const rows = [
        { transaction_date: new Date('2006-07-06T00:00:00Z'), transaction_price: 40000 },
        { transaction_date: new Date('2010-01-01T00:00:00Z'), transaction_price: 50000 },
      ];

      const result = buildPriceHistoryResult({ rows, now: NOW });

      expect(result.lookupPeriodType).toBe('최근 20년');
      expect(result.firstTransactionMonth).toBeNull();
    });

    it('최초거래가 20년 미만이면(단지가 오래되었어도) "최초거래 이후"로 전체 데이터를 반환한다', () => {
      const rows = [
        { transaction_date: new Date('2021-06-01T00:00:00Z'), transaction_price: 78000 },
        { transaction_date: new Date('2025-01-20T00:00:00Z'), transaction_price: 105000 },
      ];

      const result = buildPriceHistoryResult({ rows, now: NOW });

      expect(result.lookupPeriodType).toBe('최초거래 이후');
      expect(result.firstTransactionMonth).toBe('2021-06');
      expect(result.entries).toEqual([
        { transactionDate: '2021-06-01', transactionPrice: 78000, dataSource: DATA_SOURCE },
        { transactionDate: '2025-01-20', transactionPrice: 105000, dataSource: DATA_SOURCE },
      ]);
    });
  });

  describe('formatYearMonth', () => {
    it('한 자리 월을 0으로 패딩한다 (6월 -> 06)', () => {
      expect(formatYearMonth(new Date('2024-06-15T00:00:00Z'))).toBe('2024-06');
    });

    it('두 자리 월은 그대로 유지한다 (11월 -> 11)', () => {
      expect(formatYearMonth(new Date('2024-11-02T00:00:00Z'))).toBe('2024-11');
    });
  });

  describe('formatDateOnly', () => {
    it('한 자리 월/일을 0으로 패딩한다 (1일 -> 01)', () => {
      expect(formatDateOnly(new Date('2024-06-01T00:00:00Z'))).toBe('2024-06-01');
    });

    it('두 자리 월/일은 그대로 유지한다', () => {
      expect(formatDateOnly(new Date('2024-11-02T00:00:00Z'))).toBe('2024-11-02');
    });
  });

  describe('mapEntry', () => {
    it('row를 entry 스키마로 변환하고 dataSource는 고정 문자열이다', () => {
      const row = { transaction_date: new Date('2024-11-02T00:00:00Z'), transaction_price: 95000 };

      expect(mapEntry(row)).toEqual({
        transactionDate: '2024-11-02',
        transactionPrice: 95000,
        dataSource: DATA_SOURCE,
      });
    });
  });
});

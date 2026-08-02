const DATA_SOURCE = '국토교통부 아파트 실거래가 공개시스템(오픈API)';

function formatDateOnly(dateValue) {
  const d = new Date(dateValue);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function formatYearMonth(dateValue) {
  const d = new Date(dateValue);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
}

function mapEntry(row) {
  return {
    transactionDate: formatDateOnly(row.transaction_date),
    transactionPrice: row.transaction_price,
    dataSource: DATA_SOURCE
  };
}

function buildPriceHistoryResult({ rows, now = new Date() }) {
  if (rows.length === 0) {
    return { lookupPeriodType: '실거래 이력 없음', firstTransactionMonth: null, entries: [] };
  }

  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 20);
  const earliestTransactionDate = new Date(rows[0].transaction_date);

  if (earliestTransactionDate <= cutoff) {
    const filteredRows = rows.filter((row) => new Date(row.transaction_date) >= cutoff);
    return { lookupPeriodType: '최근 20년', firstTransactionMonth: null, entries: filteredRows.map(mapEntry) };
  }

  return {
    lookupPeriodType: '최초거래 이후',
    firstTransactionMonth: formatYearMonth(rows[0].transaction_date),
    entries: rows.map(mapEntry)
  };
}

module.exports = { buildPriceHistoryResult, formatYearMonth, formatDateOnly, mapEntry };

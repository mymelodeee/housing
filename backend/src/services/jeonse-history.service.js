const molitApiRepository = require('../repositories/molit-api.repository');
const molitPriceHistoryService = require('./molit-price-history.service');

const DATA_SOURCE = '국토교통부 아파트 전월세 실거래가 자료(오픈API)';

function parseDepositAmount(value) {
  const cleaned = String(value === undefined || value === null ? '' : value).replace(/,/g, '').trim();
  const parsed = parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function mapRentItem(item) {
  const month = String(item.dealMonth).padStart(2, '0');
  const day = String(item.dealDay).padStart(2, '0');

  return {
    aptName: item.aptNm,
    transactionDate: `${item.dealYear}-${month}-${day}`,
    deposit: parseDepositAmount(item.deposit),
    monthlyRent: parseDepositAmount(item.monthlyRent),
    exclusiveArea: item.excluUseAr === undefined ? undefined : parseFloat(item.excluUseAr)
  };
}

// 전세가율 계산 대상은 월세가 없는 순수 전세 거래만으로 한정한다.
function isJeonse(transaction) {
  return transaction.deposit !== null && (transaction.monthlyRent === null || transaction.monthlyRent === 0);
}

async function fetchJeonseTransactionsForComplex({ lawdCd, aptName, now = new Date() }) {
  const dealYmds = molitPriceHistoryService.generateRecentDealYmds(molitPriceHistoryService.LOOKUP_MONTHS, now);

  const settledResults = await molitPriceHistoryService.settleInBatches(
    dealYmds.map((dealYmd) => () => molitApiRepository.fetchAptRentXml({ lawdCd, dealYmd }))
  );

  const allItems = settledResults.flatMap((result) =>
    result.status === 'fulfilled' ? molitPriceHistoryService.parseAptTradeXml(result.value) : []
  );

  return molitPriceHistoryService
    .filterByAptName(allItems.map(mapRentItem), aptName)
    .filter(isJeonse)
    .sort((a, b) => (a.transactionDate < b.transactionDate ? -1 : 1))
    .map((tx) => ({
      transactionDate: tx.transactionDate,
      deposit: tx.deposit,
      exclusiveArea: tx.exclusiveArea,
      dataSource: DATA_SOURCE
    }));
}

function averageByMonth(entries, valueSelector) {
  const sums = new Map();
  for (const entry of entries) {
    const month = entry.transactionDate.slice(0, 7);
    const acc = sums.get(month) || { total: 0, count: 0 };
    acc.total += valueSelector(entry);
    acc.count += 1;
    sums.set(month, acc);
  }

  const result = new Map();
  for (const [month, { total, count }] of sums) {
    result.set(month, total / count);
  }
  return result;
}

// 월별 평균 전세 보증금 / 월별 평균 매매가로 전세가율(%)을 산출한다.
// 두 값이 모두 존재하는 월만 포함한다.
function buildJeonseRatioEntries({ saleEntries, jeonseEntries }) {
  const saleByMonth = averageByMonth(saleEntries, (e) => e.transactionPrice);
  const jeonseByMonth = averageByMonth(jeonseEntries, (e) => e.deposit);

  const months = [...jeonseByMonth.keys()].filter((month) => saleByMonth.has(month)).sort();

  return months.map((month) => ({
    month,
    jeonseRatioPercent: Math.round((jeonseByMonth.get(month) / saleByMonth.get(month)) * 1000) / 10
  }));
}

module.exports = {
  DATA_SOURCE,
  mapRentItem,
  isJeonse,
  fetchJeonseTransactionsForComplex,
  buildJeonseRatioEntries
};

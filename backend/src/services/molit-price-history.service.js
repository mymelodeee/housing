const { XMLParser } = require('fast-xml-parser');
const molitApiRepository = require('../repositories/molit-api.repository');

const DATA_SOURCE = '국토교통부 아파트 실거래가 공개시스템(오픈API)';
const LOOKUP_MONTHS = 36;

const xmlParser = new XMLParser();

function generateRecentDealYmds(monthsCount = LOOKUP_MONTHS, now = new Date()) {
  const result = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    result.push(`${yyyy}${mm}`);
  }
  return result;
}

function parseAptTradeXml(xmlString) {
  const parsed = xmlParser.parse(xmlString);
  const response = parsed && parsed.response;
  const resultCode = response && response.header && response.header.resultCode;

  // fast-xml-parser는 선행 0이 있는 숫자 문자열(예: "00", "03")도 숫자로 변환하므로
  // 문자열/숫자 표현을 모두 허용해 성공 코드("00")인지 판별한다.
  if (Number(resultCode) !== 0) {
    return [];
  }

  const items = response.body && response.body.items && response.body.items.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

function normalizeAptName(name) {
  return String(name || '').replace(/\s+/g, '');
}

function mapTradeItem(item) {
  const dealAmount = String(item.dealAmount || '').replace(/,/g, '').trim();
  const month = String(item.dealMonth).padStart(2, '0');
  const day = String(item.dealDay).padStart(2, '0');

  return {
    aptName: item.aptNm,
    transactionDate: `${item.dealYear}-${month}-${day}`,
    transactionPrice: parseInt(dealAmount, 10)
  };
}

function filterByAptName(transactions, aptName) {
  const target = normalizeAptName(aptName);
  return transactions.filter((tx) => {
    const candidate = normalizeAptName(tx.aptName);
    return candidate === target || candidate.includes(target) || target.includes(candidate);
  });
}

function mapEntry(transaction) {
  return {
    transactionDate: transaction.transactionDate,
    transactionPrice: transaction.transactionPrice,
    dataSource: DATA_SOURCE
  };
}

function buildMolitPriceHistoryResult({ transactions, now = new Date() }) {
  if (transactions.length === 0) {
    return { lookupPeriodType: '실거래 이력 없음', firstTransactionMonth: null, entries: [] };
  }

  const sorted = [...transactions].sort((a, b) => (a.transactionDate < b.transactionDate ? -1 : 1));

  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - LOOKUP_MONTHS);
  const earliestTransactionDate = new Date(sorted[0].transactionDate);

  if (earliestTransactionDate <= cutoff) {
    return { lookupPeriodType: '최근 3년', firstTransactionMonth: null, entries: sorted.map(mapEntry) };
  }

  return {
    lookupPeriodType: '최초거래 이후',
    firstTransactionMonth: sorted[0].transactionDate.slice(0, 7),
    entries: sorted.map(mapEntry)
  };
}

async function fetchPriceHistoryForComplex({ lawdCd, aptName, now = new Date() }) {
  const dealYmds = generateRecentDealYmds(LOOKUP_MONTHS, now);

  const settledResults = await Promise.allSettled(
    dealYmds.map((dealYmd) => molitApiRepository.fetchAptTradeXml({ lawdCd, dealYmd }))
  );

  const allItems = settledResults.flatMap((result) =>
    result.status === 'fulfilled' ? parseAptTradeXml(result.value) : []
  );

  const transactions = filterByAptName(allItems.map(mapTradeItem), aptName);

  return buildMolitPriceHistoryResult({ transactions, now });
}

module.exports = {
  generateRecentDealYmds,
  parseAptTradeXml,
  mapTradeItem,
  filterByAptName,
  buildMolitPriceHistoryResult,
  fetchPriceHistoryForComplex,
  DATA_SOURCE,
  LOOKUP_MONTHS
};

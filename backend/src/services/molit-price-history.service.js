const { XMLParser } = require('fast-xml-parser');
const molitApiRepository = require('../repositories/molit-api.repository');

const DATA_SOURCE = '국토교통부 아파트 실거래가 공개시스템(오픈API)';
const LOOKUP_MONTHS = 36;

const xmlParser = new XMLParser();

// 공공데이터포털은 초당 요청 수를 엄격히 제한한다(실측: 배치당 20건 동시 호출은 물론,
// 수 초 간격을 둔 단발 호출 2건도 종종 LIMITED_NUMBER_OF_SERVICE_REQUESTS_PER_SECOND_EXCEEDS_ERROR로
// 실패함). 실패한 월은 조용히 빈 배열로 처리되므로(parseAptTradeXml), 동시성이 높으면
// "매매/전세 이력 없음"으로 오인될 정도로 데이터가 통째로 누락될 수 있다. 이를 막기 위해
// 월별 호출을 완전히 순차 실행(배치 크기 1)하고 각 호출 사이에 간격을 둔다.
const REQUEST_BATCH_SIZE = 1;
const REQUEST_BATCH_DELAY_MS = 300;

function delay(ms) {
  // 테스트에서는 실제 대기 없이 스로틀링 로직(순차 실행 순서·배치 분할)만 검증한다.
  const effectiveMs = process.env.NODE_ENV === 'test' ? 0 : ms;
  return new Promise((resolve) => setTimeout(resolve, effectiveMs));
}

async function settleInBatches(taskFactories, batchSize = REQUEST_BATCH_SIZE, delayMs = REQUEST_BATCH_DELAY_MS) {
  const results = [];
  for (let i = 0; i < taskFactories.length; i += batchSize) {
    if (i > 0) {
      await delay(delayMs);
    }
    const settled = await Promise.allSettled(taskFactories.slice(i, i + batchSize).map((factory) => factory()));
    results.push(...settled);
  }
  return results;
}

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
    transactionPrice: parseInt(dealAmount, 10),
    exclusiveArea: item.excluUseAr === undefined ? undefined : parseFloat(item.excluUseAr)
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
    exclusiveArea: transaction.exclusiveArea,
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

  const settledResults = await settleInBatches(
    dealYmds.map((dealYmd) => () => molitApiRepository.fetchAptTradeXml({ lawdCd, dealYmd }))
  );

  const allItems = settledResults.flatMap((result) =>
    result.status === 'fulfilled' ? parseAptTradeXml(result.value) : []
  );

  const transactions = filterByAptName(allItems.map(mapTradeItem), aptName);

  return buildMolitPriceHistoryResult({ transactions, now });
}

module.exports = {
  generateRecentDealYmds,
  settleInBatches,
  parseAptTradeXml,
  mapTradeItem,
  filterByAptName,
  buildMolitPriceHistoryResult,
  fetchPriceHistoryForComplex,
  DATA_SOURCE,
  LOOKUP_MONTHS
};

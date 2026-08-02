const { TARGET_REGIONS } = require('../src/config/target-regions');
const aptListService = require('../src/services/apt-list.service');
const molitApiRepository = require('../src/repositories/molit-api.repository');
const molitPriceHistoryService = require('../src/services/molit-price-history.service');
const geocodingService = require('../src/services/geocoding.service');
const regionalListingCacheRepository = require('../src/repositories/regional-listing-cache.repository');

const RECENT_MONTHS_COUNT = 3;

function normalizeName(name) {
  return String(name || '').replace(/\s+/g, '');
}

function mapTradeItemWithArea(item) {
  const dealAmount = String(item.dealAmount || '').replace(/,/g, '').trim();
  const month = String(item.dealMonth).padStart(2, '0');
  const day = String(item.dealDay).padStart(2, '0');

  return {
    aptName: item.aptNm,
    transactionDate: `${item.dealYear}-${month}-${day}`,
    transactionPrice: parseInt(dealAmount, 10),
    exclusiveArea: item.excluUseAr === undefined ? undefined : parseFloat(item.excluUseAr),
    dong: item.umdNm,
    jibun: item.jibun
  };
}

function buildAddressFromTransaction(regionName, transaction) {
  if (transaction.dong && transaction.jibun) {
    return `${regionName} ${transaction.dong} ${transaction.jibun}`;
  }
  return null;
}

async function fetchTransactionsForRegion(lawdCd) {
  const dealYmds = molitPriceHistoryService.generateRecentDealYmds(RECENT_MONTHS_COUNT);

  const settledResults = await Promise.allSettled(
    dealYmds.map((dealYmd) => molitApiRepository.fetchAptTradeXml({ lawdCd, dealYmd }))
  );

  return settledResults.flatMap((result) =>
    result.status === 'fulfilled'
      ? molitPriceHistoryService.parseAptTradeXml(result.value).map(mapTradeItemWithArea)
      : []
  );
}

function selectLatestPerComplexAndArea(transactions) {
  const latestByKey = new Map();

  for (const transaction of transactions) {
    if (!transaction.aptName || transaction.exclusiveArea === undefined || Number.isNaN(transaction.exclusiveArea)) {
      continue;
    }

    const key = `${normalizeName(transaction.aptName)}::${transaction.exclusiveArea}`;
    const existing = latestByKey.get(key);
    if (!existing || existing.transactionDate < transaction.transactionDate) {
      latestByKey.set(key, transaction);
    }
  }

  return Array.from(latestByKey.values());
}

function matchAptListEntry(aptName, aptList) {
  const target = normalizeName(aptName);
  return aptList.find((entry) => {
    const candidate = normalizeName(entry.kaptName);
    return candidate === target || candidate.includes(target) || target.includes(candidate);
  });
}

async function resolveCoordinatesForComplex({ lawdCd, regionName, complexName, address }) {
  const cached = await regionalListingCacheRepository.findCoordinatesByComplexName({ lawdCd, complexName });
  if (cached) {
    return { latitude: cached.latitude, longitude: cached.longitude };
  }

  const query = address || `${regionName} ${complexName}`;
  return geocodingService.geocodeAddress(query);
}

async function collectRegion(region) {
  const [aptList, transactions] = await Promise.all([
    aptListService.fetchAptListForRegion(region.lawdCd),
    fetchTransactionsForRegion(region.lawdCd)
  ]);

  const latestEntries = selectLatestPerComplexAndArea(transactions);

  let collectedCount = 0;

  for (const transaction of latestEntries) {
    const matchedAptListEntry = matchAptListEntry(transaction.aptName, aptList);
    const address = buildAddressFromTransaction(region.regionName, transaction);

    const coordinates = await resolveCoordinatesForComplex({
      lawdCd: region.lawdCd,
      regionName: region.regionName,
      complexName: transaction.aptName,
      address
    });

    await regionalListingCacheRepository.upsertEntry({
      lawdCd: region.lawdCd,
      kaptCode: matchedAptListEntry ? matchedAptListEntry.kaptCode : null,
      complexName: transaction.aptName,
      address,
      exclusiveArea: transaction.exclusiveArea,
      salePrice: transaction.transactionPrice,
      transactionDate: transaction.transactionDate,
      householdCount: matchedAptListEntry ? matchedAptListEntry.householdCount : null,
      latitude: coordinates ? coordinates.latitude : null,
      longitude: coordinates ? coordinates.longitude : null
    });

    collectedCount += 1;
  }

  return collectedCount;
}

async function main() {
  const totalRegions = TARGET_REGIONS.length;
  let regionIndex = 0;

  for (const region of TARGET_REGIONS) {
    regionIndex += 1;
    console.log(`[${regionIndex}/${totalRegions}] ${region.regionName}(${region.lawdCd}) 수집 시작`);

    try {
      const collectedCount = await collectRegion(region);
      console.log(`[${regionIndex}/${totalRegions}] ${region.regionName}(${region.lawdCd}) 완료: ${collectedCount}건 수집`);
    } catch (err) {
      console.error(`[${regionIndex}/${totalRegions}] ${region.regionName}(${region.lawdCd}) 실패:`, err.message);
    }
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[ERROR] 배치 수집 실패:', err);
      process.exit(1);
    });
}

module.exports = {
  mapTradeItemWithArea,
  buildAddressFromTransaction,
  fetchTransactionsForRegion,
  selectLatestPerComplexAndArea,
  matchAptListEntry,
  resolveCoordinatesForComplex,
  collectRegion,
  main
};

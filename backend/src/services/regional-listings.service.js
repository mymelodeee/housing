const regionalListingCacheRepository = require('../repositories/regional-listing-cache.repository');
const apartmentComplexesRepository = require('../repositories/apartment-complexes.repository');
const listingsRepository = require('../repositories/listings.repository');
const geocodingService = require('./geocoding.service');
const { TARGET_REGIONS } = require('../config/target-regions');

const DEFAULT_MIN_PRICE = 70000;
const DEFAULT_MAX_PRICE = 150000;
const DEFAULT_MIN_AREA = 0;
const DEFAULT_MAX_AREA = 999;
const LISTING_MIN_SALE_PRICE = 70000;
const LISTING_MAX_SALE_PRICE = 150000;
const MIN_HOUSEHOLD_COUNT = 500;

// pg는 DATE 컬럼을 로컬 자정 기준 Date 객체로 파싱하므로, JSON 직렬화 시
// UTC ISO 문자열로 변환되어 UTC+9 환경에서 날짜가 하루 밀려 보인다(BE-7과 동일 이슈).
// 로컬 getter 기준 YYYY-MM-DD 문자열로 변환해 반환한다.
function formatLocalDate(value) {
  if (!(value instanceof Date)) return value;
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function mapCacheRow(row) {
  return {
    id: row.id,
    lawdCd: row.lawd_cd,
    kaptCode: row.kapt_code,
    complexName: row.complex_name,
    address: row.address,
    exclusiveArea: row.exclusive_area,
    salePrice: row.sale_price,
    transactionDate: formatLocalDate(row.transaction_date),
    householdCount: row.household_count,
    latitude: row.latitude,
    longitude: row.longitude,
    collectedAt: row.collected_at
  };
}

async function searchLiveListings({ minPrice, maxPrice, minArea, maxArea } = {}) {
  const rows = await regionalListingCacheRepository.findByFilters({
    minPrice: minPrice === undefined ? DEFAULT_MIN_PRICE : minPrice,
    maxPrice: maxPrice === undefined ? DEFAULT_MAX_PRICE : maxPrice,
    minArea: minArea === undefined ? DEFAULT_MIN_AREA : minArea,
    maxArea: maxArea === undefined ? DEFAULT_MAX_AREA : maxArea,
    minHouseholdCount: MIN_HOUSEHOLD_COUNT
  });
  return rows.map(mapCacheRow);
}

function findRegionNameByLawdCd(lawdCd) {
  const region = TARGET_REGIONS.find((r) => r.lawdCd === lawdCd);
  return region ? region.regionName : null;
}

async function resolveCoordinates(row) {
  if (row.latitude !== null && row.longitude !== null) {
    return { latitude: row.latitude, longitude: row.longitude };
  }

  const address = row.address || `${findRegionNameByLawdCd(row.lawd_cd) || ''} ${row.complex_name}`.trim();
  return geocodingService.geocodeAddress(address);
}

async function findOrCreateComplex(row, coordinates) {
  const address = row.address || row.complex_name;
  const existing = await apartmentComplexesRepository.findByAddress(address);
  if (existing) return existing;

  return apartmentComplexesRepository.insert({
    complexName: row.complex_name,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    address,
    completionYear: new Date().getFullYear(),
    lawdCd: row.lawd_cd,
    molitAptName: row.complex_name
  });
}

async function findOrCreateListing(complexId, row) {
  const existing = await listingsRepository.findByComplexAndArea({
    complexId,
    salePrice: row.sale_price,
    exclusiveArea: row.exclusive_area
  });
  if (existing) return existing;

  return listingsRepository.insert({
    complexId,
    salePrice: row.sale_price,
    exclusiveArea: row.exclusive_area
  });
}

async function selectCacheEntry(cacheId) {
  const row = await regionalListingCacheRepository.findById(cacheId);
  if (!row) return null;

  if (row.sale_price < LISTING_MIN_SALE_PRICE || row.sale_price > LISTING_MAX_SALE_PRICE) {
    const err = new Error(
      `선택한 매물의 실거래가(${row.sale_price}만원)가 서비스 탐색 범위(${LISTING_MIN_SALE_PRICE}~${LISTING_MAX_SALE_PRICE}만원)를 벗어납니다`
    );
    err.status = 422;
    throw err;
  }

  const coordinates = await resolveCoordinates(row);
  if (!coordinates) {
    const err = new Error('선택한 매물의 좌표를 확인할 수 없습니다');
    err.status = 422;
    throw err;
  }

  const complex = await findOrCreateComplex(row, coordinates);
  const listing = await findOrCreateListing(complex.id, row);

  return { listingId: listing.id };
}

module.exports = { searchLiveListings, selectCacheEntry, mapCacheRow };

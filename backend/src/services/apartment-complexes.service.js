const apartmentComplexesRepository = require('../repositories/apartment-complexes.repository');
const apartmentComplexPriceService = require('./apartment-complex-price.service');
const localityEnrichmentService = require('./locality-enrichment.service');

// 학군/개발호재는 각각 전용 탭(단지 상세 "학군"/"개발호재")으로 대체돼 완전 중복이라
// 2026-09-08 정리하며 제거했다(docs/search-architecture-refactor-plan.md §6/§18).
const LOCALITY_KEY_MAP = {
  교통: 'transportation',
  상권: 'commercialArea',
  강남접근성: 'gangnamAccessibility',
  '유흥·공원': 'entertainmentAndParks',
  주변일자리: 'nearbyJobs'
};

function mapLandTransactionZoneStatus(value) {
  return value === null ? '확인필요' : value;
}

function mapLocalityAttributes(jsonb) {
  const source = jsonb || {};
  const result = {};

  for (const [koreanKey, englishKey] of Object.entries(LOCALITY_KEY_MAP)) {
    const value = source[koreanKey];
    result[englishKey] = value === null || value === undefined ? '정보 없음' : value;
  }

  return result;
}

function mapSummaryFields(row) {
  return {
    id: row.id,
    complexName: row.complex_name,
    address: row.address,
    completionYear: row.completion_year,
    remodelingStatus: row.remodeling_status,
    reconstructionStatus: row.reconstruction_status,
    isRegulatedArea: row.is_regulated_area,
    isLandTransactionPermissionZone: mapLandTransactionZoneStatus(row.is_land_transaction_permission_zone),
    nearestShuttleStopName: row.nearest_shuttle_stop_name,
    nearestShuttleStopDistance: row.nearest_shuttle_stop_distance,
    shuttleCommuteMinutes: row.shuttle_commute_minutes,
    householdCount: row.household_count,
    buildingCount: row.building_count
  };
}

async function listComplexSummaries() {
  const rows = await apartmentComplexesRepository.findAll();
  return rows.map(mapSummaryFields);
}

async function getComplexDetail(id) {
  const row = await apartmentComplexesRepository.findById(id);

  if (!row) {
    return null;
  }

  const priceRange = await apartmentComplexPriceService.getComplexPriceRange(id);
  const localityAttributes = await localityEnrichmentService.enrichLocalityAttributes(
    mapLocalityAttributes(row.locality_attributes),
    row.latitude,
    row.longitude
  );

  return {
    ...mapSummaryFields(row),
    latitude: row.latitude,
    longitude: row.longitude,
    remodelingCompletionYear: row.remodeling_completion_year,
    nearbyRedevelopmentInfo: row.nearby_redevelopment_info,
    localityAttributes,
    priceRange
  };
}

module.exports = { listComplexSummaries, getComplexDetail, mapSummaryFields };

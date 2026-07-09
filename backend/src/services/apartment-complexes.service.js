const apartmentComplexesRepository = require('../repositories/apartment-complexes.repository');
const apartmentComplexPriceService = require('./apartment-complex-price.service');

const LOCALITY_KEY_MAP = {
  교통: 'transportation',
  상권: 'commercialArea',
  학군: 'schoolDistrict',
  강남접근성: 'gangnamAccessibility',
  '유흥·공원': 'entertainmentAndParks',
  개발호재: 'developmentProspects',
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
    shuttleCommuteMinutes: row.shuttle_commute_minutes
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

  return {
    ...mapSummaryFields(row),
    latitude: row.latitude,
    longitude: row.longitude,
    remodelingCompletionYear: row.remodeling_completion_year,
    nearbyRedevelopmentInfo: row.nearby_redevelopment_info,
    localityAttributes: mapLocalityAttributes(row.locality_attributes),
    priceRange
  };
}

module.exports = { listComplexSummaries, getComplexDetail, mapSummaryFields };

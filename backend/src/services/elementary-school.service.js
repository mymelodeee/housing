const elementarySchoolsRepository = require('../repositories/elementary-schools.repository');
const { haversineDistanceMeters } = require('../utils/geo');

const METERS_PER_DEGREE_LAT = 111320;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function buildBoundingBoxDegrees(latitude, longitude, radiusMeters) {
  const latDelta = radiusMeters / METERS_PER_DEGREE_LAT;
  const lngDelta = radiusMeters / (METERS_PER_DEGREE_LAT * Math.cos(toRadians(latitude)));

  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLng: longitude - lngDelta,
    maxLng: longitude + lngDelta
  };
}

// 배정학교 표시는 반경 제한 없이(탐색 반경 3km 내) 가장 가까운 학교를 근사치로 사용한다.
// 실제 배정은 교육청 학구도에 따라 달라질 수 있다(도메인 문서에 한계 명시).
const ASSIGNED_SCHOOL_SEARCH_RADIUS_METERS = 3000;

function selectNearest(candidates, latitude, longitude) {
  let nearest = null;

  for (const school of candidates) {
    const distanceMeters = haversineDistanceMeters(latitude, longitude, school.latitude, school.longitude);
    if (!nearest || distanceMeters < nearest.distanceMeters) {
      nearest = { schoolName: school.school_name, distanceMeters: Math.round(distanceMeters) };
    }
  }

  return nearest;
}

async function findNearestSchoolByLevel(latitude, longitude, schoolLevel) {
  const boundingBox = buildBoundingBoxDegrees(latitude, longitude, ASSIGNED_SCHOOL_SEARCH_RADIUS_METERS);
  const candidates = await elementarySchoolsRepository.findWithinBoundingBox({ ...boundingBox, schoolLevel });
  return selectNearest(candidates, latitude, longitude);
}

module.exports = {
  ASSIGNED_SCHOOL_SEARCH_RADIUS_METERS,
  haversineDistanceMeters,
  buildBoundingBoxDegrees,
  selectNearest,
  findNearestSchoolByLevel
};

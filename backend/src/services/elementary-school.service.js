const elementarySchoolsRepository = require('../repositories/elementary-schools.repository');

const RADIUS_METERS = 700;
const EARTH_RADIUS_METERS = 6371000;
const METERS_PER_DEGREE_LAT = 111320;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

function selectNearestWithin700m(candidates, latitude, longitude) {
  let nearest = null;

  for (const school of candidates) {
    const distanceMeters = haversineDistanceMeters(latitude, longitude, school.latitude, school.longitude);

    if (distanceMeters <= RADIUS_METERS && (!nearest || distanceMeters < nearest.distanceMeters)) {
      nearest = { schoolName: school.school_name, distanceMeters: Math.round(distanceMeters) };
    }
  }

  return nearest;
}

async function findNearestElementarySchoolWithin700m(latitude, longitude) {
  const boundingBox = buildBoundingBoxDegrees(latitude, longitude, RADIUS_METERS);
  const candidates = await elementarySchoolsRepository.findWithinBoundingBox({
    ...boundingBox,
    schoolLevel: '초등학교'
  });
  return selectNearestWithin700m(candidates, latitude, longitude);
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
  RADIUS_METERS,
  ASSIGNED_SCHOOL_SEARCH_RADIUS_METERS,
  haversineDistanceMeters,
  buildBoundingBoxDegrees,
  selectNearestWithin700m,
  selectNearest,
  findNearestElementarySchoolWithin700m,
  findNearestSchoolByLevel
};

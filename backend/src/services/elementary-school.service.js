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
  const candidates = await elementarySchoolsRepository.findWithinBoundingBox(boundingBox);
  return selectNearestWithin700m(candidates, latitude, longitude);
}

module.exports = {
  RADIUS_METERS,
  haversineDistanceMeters,
  buildBoundingBoxDegrees,
  selectNearestWithin700m,
  findNearestElementarySchoolWithin700m
};

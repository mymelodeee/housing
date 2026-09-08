const { haversineDistanceMeters } = require('../utils/geo');

// 강남역(2호선) 좌표. 네이버클라우드플랫폼 Geocoding API로 정밀 확인한 값(geocoding.service.test.js 참고).
// 도메인 §3.7.1: 강남 접근성은 직선거리만 표시한다(대중교통 소요시간 계산은 범위 밖).
const GANGNAM_STATION_LATITUDE = 37.497942;
const GANGNAM_STATION_LONGITUDE = 127.027621;

function calculateGangnamAccessibility(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null;
  }

  const distanceMeters = haversineDistanceMeters(
    Number(latitude),
    Number(longitude),
    GANGNAM_STATION_LATITUDE,
    GANGNAM_STATION_LONGITUDE
  );
  const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;

  return `강남역 직선 ${distanceKm}km`;
}

module.exports = {
  GANGNAM_STATION_LATITUDE,
  GANGNAM_STATION_LONGITUDE,
  calculateGangnamAccessibility
};

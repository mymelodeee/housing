const entertainmentVenueService = require('./entertainment-venue.service');
const gangnamAccessibilityService = require('./gangnam-accessibility.service');
const commercialAreaService = require('./commercial-area.service');

const NO_INFO = '정보 없음';

function formatEntertainment(hasVenue) {
  return hasVenue ? '유흥주점 있음 (700m 이내)' : '유흥주점 없음 (700m 이내)';
}

async function enrichLocalityAttributes(baseAttributes, latitude, longitude) {
  const result = { ...baseAttributes };

  if (latitude == null || longitude == null) {
    return result;
  }

  if (result.entertainmentAndParks === NO_INFO) {
    const hasVenue = await entertainmentVenueService.hasEntertainmentVenueWithin700m(latitude, longitude);
    result.entertainmentAndParks = formatEntertainment(hasVenue);
  }

  if (result.gangnamAccessibility === NO_INFO) {
    // 좌표 계산이라 API 실패 여지가 없다 — latitude/longitude가 있는 한 항상 값이 나온다.
    result.gangnamAccessibility = gangnamAccessibilityService.calculateGangnamAccessibility(latitude, longitude);
  }

  if (result.commercialArea === NO_INFO) {
    result.commercialArea = await commercialAreaService.summarizeCommercialArea(latitude, longitude);
  }

  return result;
}

module.exports = { enrichLocalityAttributes };

const elementarySchoolService = require('./elementary-school.service');
const entertainmentVenueService = require('./entertainment-venue.service');

const NO_INFO = '정보 없음';

function formatSchoolDistrict(nearestSchool) {
  return `${nearestSchool.schoolName} (${nearestSchool.distanceMeters}m 이내)`;
}

function formatEntertainment(hasVenue) {
  return hasVenue ? '유흥주점 있음 (700m 이내)' : '유흥주점 없음 (700m 이내)';
}

async function enrichLocalityAttributes(baseAttributes, latitude, longitude) {
  const result = { ...baseAttributes };

  if (latitude == null || longitude == null) {
    return result;
  }

  if (result.schoolDistrict === NO_INFO) {
    const nearestSchool = await elementarySchoolService.findNearestElementarySchoolWithin700m(latitude, longitude);
    if (nearestSchool) {
      result.schoolDistrict = formatSchoolDistrict(nearestSchool);
    }
  }

  if (result.entertainmentAndParks === NO_INFO) {
    const hasVenue = await entertainmentVenueService.hasEntertainmentVenueWithin700m(latitude, longitude);
    result.entertainmentAndParks = formatEntertainment(hasVenue);
  }

  return result;
}

module.exports = { enrichLocalityAttributes };

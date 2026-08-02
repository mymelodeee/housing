const storeInfoApiRepository = require("../repositories/store-info-api.repository");

const RADIUS_METERS = 700;

// 유흥주점업 표준산업분류코드(indsSclsCd): 일반유흥주점업/무도유흥주점업/기타주점업 등(552201~552206/I56211~I56213은 실측 결과 항상 결과없음)
const ENTERTAINMENT_INDUSTRY_CODES = ["I21101", "I21102", "I21103", "I21109"];

function hasVenueInResponse(json) {
  const items = json && json.body && json.body.items;
  return Boolean(
    json &&
    json.header &&
    json.header.resultCode === "00" &&
    Array.isArray(items) &&
    items.length > 0,
  );
}

async function hasEntertainmentVenueWithin700m(latitude, longitude) {
  for (const indsSclsCd of ENTERTAINMENT_INDUSTRY_CODES) {
    const json = await storeInfoApiRepository.fetchStoresInRadius({
      cx: longitude,
      cy: latitude,
      radius: RADIUS_METERS,
      indsSclsCd,
    });

    if (hasVenueInResponse(json)) {
      return true;
    }
  }

  return false;
}

module.exports = {
  RADIUS_METERS,
  ENTERTAINMENT_INDUSTRY_CODES,
  hasVenueInResponse,
  hasEntertainmentVenueWithin700m,
};

const storeInfoApiRepository = require('../repositories/store-info-api.repository');

const RADIUS_METERS = 700;

// 소상공인시장진흥공단 상가업소정보 소분류코드(indsSclsCd) 중 "상권" 구성요소로 다루는
// 4개 카테고리의 대표 코드(2026-09-08 datago-api-prober 실측: 강남역 좌표 1km 반경 실호출로
// resultCode 00 + totalCount > 0 확인). 유흥/학원가와 동일하게 카테고리 전체를 모두 나열하지
// 않고 각 카테고리를 대표하는 주요 코드만 합산한다(전수 나열 시 호출 수가 과도해짐).
const RESTAURANT_INDUSTRY_CODES = ['I20101', 'I20201', 'I20301', 'I20401']; // 한식/중식/일식/경양식
const CAFE_INDUSTRY_CODES = ['I21201']; // 카페(비알코올)
const MART_CONVENIENCE_INDUSTRY_CODES = ['G20404', 'G20405']; // 슈퍼마켓/편의점
const CLINIC_INDUSTRY_CODES = ['Q10201', 'Q10209', 'Q10210']; // 내과·소아과/기타 의원/치과의원

function extractTotalCount(json) {
  const isSuccess = json && json.header && json.header.resultCode === '00';
  if (!isSuccess) return 0;
  const totalCount = json.body && json.body.totalCount;
  return typeof totalCount === 'number' ? totalCount : 0;
}

// 공공데이터포털 초당 요청 제한을 피하기 위해(academy.service.js와 동일 이유) 업종코드별
// 조회를 순차 실행한다. numOfRows=1로 요청해 응답 본문은 최소화하고 totalCount만 합산한다.
async function countByIndustryCodes(latitude, longitude, industryCodes) {
  let total = 0;
  for (const indsSclsCd of industryCodes) {
    const json = await storeInfoApiRepository.fetchStoresInRadius({
      cx: longitude,
      cy: latitude,
      radius: RADIUS_METERS,
      indsSclsCd,
      numOfRows: 1
    });
    total += extractTotalCount(json);
  }
  return total;
}

async function summarizeCommercialArea(latitude, longitude) {
  const restaurantCount = await countByIndustryCodes(latitude, longitude, RESTAURANT_INDUSTRY_CODES);
  const cafeCount = await countByIndustryCodes(latitude, longitude, CAFE_INDUSTRY_CODES);
  const martConvenienceCount = await countByIndustryCodes(latitude, longitude, MART_CONVENIENCE_INDUSTRY_CODES);
  const clinicCount = await countByIndustryCodes(latitude, longitude, CLINIC_INDUSTRY_CODES);

  return `음식점 ${restaurantCount} · 카페 ${cafeCount} · 마트/편의점 ${martConvenienceCount} · 병원 ${clinicCount} (${RADIUS_METERS}m 이내)`;
}

module.exports = {
  RADIUS_METERS,
  RESTAURANT_INDUSTRY_CODES,
  CAFE_INDUSTRY_CODES,
  MART_CONVENIENCE_INDUSTRY_CODES,
  CLINIC_INDUSTRY_CODES,
  extractTotalCount,
  countByIndustryCodes,
  summarizeCommercialArea
};

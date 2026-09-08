const storeInfoApiRepository = require('../repositories/store-info-api.repository');

const RADIUS_METERS = 1000;

// 소상공인시장진흥공단 상가업소정보 소분류코드 중 "학원가" 개념에 해당하는 실제 학원 8종
// (2026-09-08 datago-api-prober 실측: middleUpjongList/smallUpjongList로 확인).
// "(인적용역)" 접미 코드는 개인 프리랜서 등록 형태라 실제 학원 점포가 아니므로 제외하고,
// 운전학원(P10623)은 성인 대상 시설로 "학원가"가 뜻하는 자녀 교육 밀집도와 무관해 제외했다.
const ACADEMY_INDUSTRY_CODES = [
  'P10501', // 입시·교과학원
  'P10611', // 미술학원
  'P10615', // 외국어학원
  'P10603', // 요가/필라테스 학원
  'P10609', // 음악학원
  'P10617', // 전문자격/고시학원
  'P10627', // 컴퓨터 학원
  'P10601' // 태권도/무술학원
];

function extractTotalCount(json) {
  const isSuccess = json && json.header && json.header.resultCode === '00';
  if (!isSuccess) return 0;
  const totalCount = json.body && json.body.totalCount;
  return typeof totalCount === 'number' ? totalCount : 0;
}

// 공공데이터포털 초당 요청 제한을 피하기 위해(molit-price-history.service.js와 동일 이유)
// 업종코드별 조회를 순차 실행한다. numOfRows=1로 요청해 응답 body는 최소화하고
// totalCount만 합산한다.
async function countAcademiesWithin1km(latitude, longitude) {
  let total = 0;

  for (const indsSclsCd of ACADEMY_INDUSTRY_CODES) {
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

module.exports = {
  RADIUS_METERS,
  ACADEMY_INDUSTRY_CODES,
  extractTotalCount,
  countAcademiesWithin1km
};
